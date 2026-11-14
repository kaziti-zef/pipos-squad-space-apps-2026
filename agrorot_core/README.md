# AgroRot – `data/`

This folder holds every dataset used by **AgriRot**, a web decision-support tool that compares crop-rotation strategies for a farm parcel. It combines **NASA Earth observations** with **local agricultural information** (soil, crop traits, farmer priorities).

First case study: the outskirts of Yaoundé, Cameroon (around lat 3.87, lon 11.52). The data pipeline itself is global: only the crop table and the seasonal calendar change by region.

> Status markers: items tagged **[TODO]** or **[VERIFY]** are not finished or not yet confirmed. Update them as the team progresses.



## 1. Folder layout (planned)


data/
├── README.md              <- this file
├── raw/                   <- raw downloads (NOT committed, see .gitignore)
├── processed/             <- monthly files read by the backend and the core engine
├── crops/
│   └── tableau_cultures_agrorot.csv   <- crop table (10 crops, to be verified)
├── samples/
│   └── yaounde_outskirts/ <- small files for the demo and offline tests
└── scripts/               <- download and processing scripts [TODO]
```



## 2. Data sources

| Source | Variables used | Resolution | Period | Role in AgroRot | Status |
|---|---|---|---|---|---|
| **NASA POWER** (Agroclimatology community, monthly) | `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN` | about 0.5 x 0.625 deg (MERRA-2 based) | 1981-01 to 2024-12 for monthly data | Temperature, rainfall, humidity, radiation per parcel; long series for the trend model | [TODO] |
| **GPM IMERG** | Precipitation | [VERIFY] about 0.1 deg | [VERIFY] | Monthly rainfall, heavy-rain days, year-to-year variability | [TODO] |
| **SMAP** | Surface soil moisture | [VERIFY] about 9–36 km depending on product | [VERIFY] | Water-stress signal (surface layer only) | [TODO] |
| **MODIS / VIIRS** (Landsat optional) | NDVI | 250–1000 m (Landsat 30 m) | [VERIFY] | Vegetation vigor, bare-soil periods | [TODO] |
| **ERA5 / GLDAS** (optional) | Temperature, precipitation, soil moisture | [VERIFY] | [VERIFY] | Long series for the trend model | optional |
| **SRTM** (optional) | Elevation, slope | [VERIFY] | static | Erosion and runoff risk | optional |
| **FAO GAEZ / FAO EcoCrop** (non-NASA) | Crop requirements and suitability | tabular / global layers | static | Build and check the crop table | [TODO] |
| **Farmer input** | Soil, irrigation, crop history, priorities, constraints, market | per parcel | entered in the app | Local information that confirms or overrides satellite context | in the app |

Sources listed in the challenge resources that cover the United States only (Web Soil Survey, SSURGO/STATSGO2, CDL, NLCD, NAIP, PRISM, CoCoRaHS, NWIS, USDA AMS, QuickStats, OpenET, LANDFIRE, Ag Data Commons) are **not used** in the core, because the first case study is in Cameroon.



## 3. Accounts and access

- **NASA POWER**: no key needed for the API.
- **NASA Earthdata login** (free): usually required for IMERG, SMAP and MODIS/VIIRS downloads. [VERIFY]
- **Copernicus Climate Data Store** (free): only if ERA5 is used. [VERIFY]
- Store credentials in a local `.env` file that is **excluded from Git**. Never commit passwords or API keys.

```
# .env (example, not committed)
EARTHDATA_USERNAME=...
EARTHDATA_PASSWORD=...
```



## 4. How to get the data

Quick manual test of NASA POWER (monthly, parcel centre). [VERIFY] the exact request format against the official POWER API documentation.

```python
import requests

url = "https://power.larc.nasa.gov/api/temporal/monthly/point"
params = {
    "parameters": "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN",
    "community": "AG",
    "latitude": 3.87,
    "longitude": 11.52,
    "start": 2015,
    "end": 2024,
    "format": "JSON",
}
r = requests.get(url, params=params, timeout=60)
r.raise_for_status()
data = r.json()["properties"]["parameter"]
```

Planned scripts **[TODO]**:

| Script | What it does |
|---|---|
| `scripts/fetch_power.py` | Downloads POWER monthly data for a latitude/longitude |
| `scripts/fetch_imerg.py` | Downloads and aggregates IMERG rainfall |
| `scripts/fetch_smap.py` | Downloads and aggregates SMAP soil moisture |
| `scripts/fetch_ndvi.py` | Downloads and aggregates NDVI |
| `scripts/build_monthly.py` | Merges everything into one monthly file per zone |

Each download should record the **download date** and the **dataset version** in the file metadata or in a log.



## 5. Processing

1. **Common time step**: everything is brought to a **monthly** step.
2. **Common grid**: values are attached to the grid cell that contains the parcel centre. Finer data are averaged; coarser data are read as they are.
3. **Units**: POWER precipitation is in mm/day, so it is multiplied by the number of days in the month to get mm/month.
4. **Missing values**: the POWER value `-999` means "no data" and is excluded from every average.
5. **Climatology**: the mean of each calendar month across years gives 12 values per variable. This is the baseline used for anomalies (soil moisture, NDVI) and for the trend model.



## 6. Produced files (data contract)

### `processed/climate_monthly_<zone>.csv`

| Column | Unit | Description |
|---|---|---|
| `zone_id` | – | Identifier of the zone or grid cell |
| `lat`, `lon` | degrees | Parcel centre used for the query |
| `year`, `month` | – | Calendar year and month |
| `t2m_c` | °C | Mean air temperature at 2 m |
| `t2m_max_c`, `t2m_min_c` | °C | Monthly max and min temperature |
| `precip_mm_month` | mm | Rainfall total |
| `rh2m_pct` | % | Relative humidity at 2 m |
| `solar_kwh_m2_day` | kWh/m²/day | Surface shortwave downward irradiance |
| `soil_moisture` | m³/m³ | SMAP surface soil moisture [TODO] |
| `ndvi` | – | Vegetation index (−1 to 1) [TODO] |

Column names are a proposal: keep this table in sync with the backend.

### `crops/tableau_cultures_agrirot.csv`

10 crops common in Cameroon: maize, cassava, groundnut, common bean, cowpea, plantain, tomato, okra, yam, sweet potato.

| Column | Meaning |
|---|---|
| `culture` | Crop name |
| `famille_botanique` | Botanical family (used by the rotation rules) |
| `temp_opt_min_c`, `temp_opt_max_c` | Optimal temperature range (°C) |
| `pluie_min_mm`, `pluie_max_mm` | Rainfall range over the cycle (mm) |
| `besoin_eau`, `tolerance_secheresse` | Water need and drought tolerance (qualitative) |
| `ph_min`, `ph_max` | Preferred soil pH range |
| `sol_prefere` | Preferred soil texture/drainage |
| `cycle_jours_min`, `cycle_jours_max` | Cycle length (days) |
| `saison_semis` | Sowing season (general) |
| `role_rotation` | Role in a rotation |
| `fixe_azote` | Nitrogen-fixing crop (yes/no) |
| `source` | Where the values come from |
| `statut` | `a verifier` or `verifie` |

**Important:** all values are currently **indicative** (general agronomic knowledge) and every row has the status "to verify". Check each row against FAO EcoCrop, FAO GAEZ or a local source (for example IRAD or IITA), then update `source` and `statut`.

### Region extension

One crop file per region (`crops_<region>.csv`) plus a seasonal calendar. The climate pipeline does not change.



## 7. Quality and limitations

- NASA POWER is coarse (tens of kilometres): two neighbouring parcels often get the same values. It describes the **zone**, not the parcel.
- SMAP measures the **surface layer** only, not the root zone.
- Clouds can reduce usable NDVI images in the tropics.
- Satellite products are **estimates**; the farmer's own observations take priority when they differ.
- Crop-table values are not yet verified.
- No local yield data is available yet, so the project does not train a yield model.

---

## 8. Size and Git

- `raw/` is listed in `.gitignore`; use the scripts to recreate it.
- Keep in the repository only the small files needed to run the demo (`samples/`) and the crop table.
- For large files, use Git LFS or provide a download link. [TODO]

---

## 9. Licences and credits

- Cite each data provider as indicated on its dataset page and follow its terms of use. [TODO: add the exact citation for each source]
- NASA data are credited to NASA and the relevant mission or product team.
- Do not use NASA logos in the project.
- FAO data: check the usage terms before redistributing any extract. [VERIFY]

---

## 10. Use of AI

Parts of the scripts, the processing logic and the first draft of the crop table and of this README were prepared with the help of an AI assistant, then reviewed by the team. [TODO: list exactly which files and what was reviewed.]

---

## 11. Team and contact

[TODO: team name, members, link to the project repository.]
