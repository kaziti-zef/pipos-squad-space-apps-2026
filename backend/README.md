# 02 — Backend Architecture

**Version 1.0 (validated 14 Nov 2026).** Stack: Python 3.11+, FastAPI, SQLAlchemy, Shapely, NumPy, Pandas, scikit-learn, XGBoost, pytest.

## Chosen approach
**Hybrid deterministic engine** + trend-based climate projection + resilience "crash-test" simulator. Rejected: pure deep reinforcement learning and deep networks (LSTM), because of no local yield data in Cameroon, overfitting risk on 43 years of monthly data, and the challenge's explainability requirement.

## Golden rule: watertight boundary between Web and AI
`agrorot_core/` is pure Python (NumPy/Pandas) with **no dependency** on FastAPI, SQLAlchemy or the network. It receives standard data structures and returns a dict validated afterwards by Pydantic. Benefits: unit tests in < 0.1 s and portability to any region.

## Request flow (e.g. `POST /api/v1/parcels/{id}/strategies`)
1. **Receive & validate (non-AI)** — FastAPI validates the JSON contract with Pydantic.
2. **Assemble context (non-AI)** — load geometry, local inputs, last 3 seasons, cached NASA series from SQLite.
3. **Call engine (AI)** — `agrorot_core.generate_strategies(...)`.
4. **Compute & explain (AI)** — climate trend, scenario sliders, trapezoidal suitability, rules R1–R9, Beam Search over 6 seasons, deterministic explanations in < 150 ms.
5. **Serialize & respond (non-AI)** — format per the API contract.

## Repository layout
```
agrorot-backend/
├── README.md
├── requirements.txt
├── .env.example            # SECRET_KEY, DATABASE_URL, NASA_TIMEOUT=4.0, FORCE_DEMO_MODE=False
├── app/                    # [P3] web server & infrastructure (no AI)
│   ├── main.py             # FastAPI entry, CORS, global JSON error handler
│   ├── config.py  database.py  models.py  schemas.py  auth.py
│   ├── routers/            # auth_router, farm_router, parcel_router, strategy_router
│   └── services/           # geo_service, nasa_client, pdf_service
├── agrorot_core/           # [P5 & P6] decision engine & ML
│   ├── __init__.py         # exposes generate_strategies(context) -> dict
│   ├── models_domain.py    # lightweight dataclasses
│   ├── forecasting.py      # [P6] linear trend, Z-scores, weather sliders
│   ├── scoring.py          # [P5] trapezoids, geometric mean, score S(c,t)
│   ├── rules.py            # [P5] rules R1–R9
│   ├── optimizer.py        # [P5] Beam Search, 3 strategies, Hamming, crash-test
│   └── explainer.py        # [P5] confidence and 5 explanation sections
├── data/                   # [P4 & P6]
│   ├── crops_cm.csv  nasa_yaounde_grid.json  demo_fallback.json
├── ml_calibration/         # [P6] offline scripts
│   ├── train_us_calibration.py   # XGBoost on USDA QuickStats/SSURGO + SHAP
│   └── evaluate_climate_ml.py    # temporal validation (1981–2018 vs 2019–2024), MAE
└── tests/                  # pytest suite
```

## Infrastructure (`app/`, P3 & P4)
### Security and roles
- Pydantic v2 schemas; global handler always returns `{"error": {"code": "...", "message": "..."}}`.
- bcrypt password hashing, JWT Bearer tokens, role check against `farm_members`.
- Roles: **owner** (full access, manage members/parcels), **co_farmer** (draw parcels, field inputs, simulations, save strategies), **advisor** (view diagnostics, simulate, trial manual edits, add validation notes).

### Database (SQLite via SQLAlchemy; PostgreSQL later)
| Table | Key columns | Role |
|-------|-------------|------|
| users | id, full_name, identifier (unique), hashed_password | Accounts |
| farms | id, name, region (e.g. `cm_yaounde`), owner_id | Farm tied to a regional reference |
| farm_members | id, farm_id, user_id, role, joined_at | 0..N members per farm |
| parcels | id, farm_id, name, geojson, area_ha, lat, lon, local_inputs_json | Geometry, area, field inputs |
| crop_histories | id, parcel_id, season_index (−3..−1), label, crop_id | Last 3 crops |
| saved_strategies | id, parcel_id, strategy_type, payload_json, advisor_note, created_at | Saved choices and notes, PDF export |
| nasa_cache | grid_cell_id (PK), source, data_json, updated_at | NASA POWER cache and Plan B |

### Geospatial service (`geo_service.py`)
- GeoJSON → Shapely; check ring closure and no self-intersection (`geom.is_valid`); reject with `INVALID_POLYGON` if corrupt or zero-area.
- Centroid (lat, lon) in WGS84 (EPSG:4326); reproject (UTM 32N, EPSG:32632 for Yaoundé) with pyproj to compute `area_ha`.

### NASA connector (`nasa_client.py`)
- Async live call (`httpx`, timeout **4.0 s**) to NASA POWER Agroclimatology at the plot centroid: monthly series since 1981 (`T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`).
- Cleaning: replace `-999` with the location's monthly normal; convert mm/day → mm/month.
- Merge with pre-aggregated grids in `data/nasa_yaounde_grid.json` (GPM IMERG rain, SMAP anomaly, MODIS NDVI, SRTM slope).
- **Plan B**: on timeout/network error fall back to `nasa_cache` or `data/demo_fallback.json` and set `"data_source_status": "fallback_cache"`.
- Target response time < 500 ms.
