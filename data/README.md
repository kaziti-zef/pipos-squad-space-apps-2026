# AgriRot – `data/`

This folder holds every dataset used by **AgriRot**, a web decision-support tool that compares crop-rotation strategies for a farm parcel. It combines **NASA Earth observations** with **local agricultural information** (soil, crop traits, farmer priorities).

AgriRot is **global by design**. Its first configuration is Cameroon, around the outskirts of Yaoundé (lat 3.87, lon 11.52), because that is where the crop table and the seasonal calendar were built. The data pipeline does not change from one region to another: to add a region, add a crop table and a seasonal calendar for it.

Challenge: **Field Shift: Adapting Farms with NASA Data** (NASA International Space Apps Challenge).

---

## 1. Folder layout

```
data/
├── README.md              <- this file
├── raw/                   <- raw downloads (not committed, see .gitignore)
├── processed/             <- monthly files read by the backend and the core engine
├── crops/
│   └── tableau_cultures_agrirot.csv   <- crop table (10 crops)
├── samples/
│   └── yaounde_outskirts/ <- small files for the demo and tests
└── scripts/               <- download and processing scripts
```

---

## 2. Data sources

### NASA data

| Source | Variables used | Resolution | Period | Role in AgriRot |
|---|---|---|---|---|
| [**NASA POWER**](https://power.larc.nasa.gov/) (Agroclimatology community, monthly) | `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `RH2M`, `ALLSKY_SFC_SW_DWN` | about 0.5° × 0.625° | 1981 to 2024 | Temperature, rainfall, humidity and radiation per parcel; long series for the trend model |
| [**GPM IMERG**](https://giovanni.gsfc.nasa.gov/) (via Giovanni) | Precipitation | about 0.1° | 2000 to present | Monthly rainfall, heavy-rain days, year-to-year variability, start of the rainy seasons |
| [**SMAP SPL3SMP_E**](https://nsidc.org/data/spl3smp_e) | Surface soil moisture | about 9 km | 2015 to present | Water-stress signal compared with the local normal (surface layer only) |
| [**MODIS MOD13Q1 v061**](https://lpdaac.usgs.gov/products/mod13q1v061/) | NDVI | 250 m, 16-day composites | 2000 to present | Vegetation vigour, crop cycles, bare-soil periods |
| [**SRTM**](https://opentopography.org/) (via OpenTopography) | Elevation, slope | about 30 m | static | Erosion and runoff risk |

Access tools: [NASA POWER API documentation](https://power.larc.nasa.gov/docs/services/api/), [AppEEARS](https://appeears.earthdatacloud.nasa.gov/) for point extraction, and [NASA Earthdata Login](https://urs.earthdata.nasa.gov/) for authentication.

### Agronomy (FAO)

| Source | Role in AgriRot |
|---|---|
| [FAO EcoCrop](https://gaez.fao.org/pages/ecocrop) | Crop requirements (temperature, rainfall, pH, cycle length) used to build the crop table |
| [FAO Crop Calendar](https://cropcalendar.apps.fao.org/) | Sowing and harvest seasons |
| [FAO-56, Crop evapotranspiration](https://www.fao.org/3/x0490e/x0490e00.htm) (Allen et al., 1998) | Crop water requirement and water balance |
| FAO-33, Yield response to water (Doorenbos and Kassam, 1979) | Sensitivity of crops to water stress |

### Methods

| Method | Role in AgriRot |
|---|---|
| RUSLE (Renard et al., 1997) | Soil-erosion risk from rainfall, slope and cover |
| Rank Order Centroid, ROC (Barron and Barrett, 1996) | Converts the farmer's ranked priorities into weights |

### Weather forecasts

| Source | Role in AgriRot |
|---|---|
| [Meteomatics API](https://www.meteomatics.com/en/api/) | Weather forecasts and history |
| [Open-Meteo](https://open-meteo.com/en/docs) | Open weather forecasts |

### Farmer input

Soil, irrigation, crop history, priorities, constraints and local market, entered in the app. These inputs confirm or override the satellite context.

Sources that cover the United States only (Web Soil Survey, SSURGO/STATSGO2, CDL, NLCD, NAIP, PRISM, CoCoRaHS, NWIS, USDA AMS, QuickStats, OpenET, LANDFIRE, Ag Data Commons) are not used in the core, because the first configuration is in Cameroon.

---

## 3. Accounts and access

- **NASA POWER**: no key needed for the API.
- **NASA Earthdata Login** (free): required for SMAP, MODIS (through AppEEARS) and IMERG (through Giovanni).
- **OpenTopography**: free account for API access to SRTM.
- **Meteomatics**: account credentials. **Open-Meteo**: no key for open use.
- Store credentials in a local `.env` file that is **excluded from Git**. Never commit passwords or API keys.

```
# .env (example, not committed)
EARTHDATA_USERNAME=...
EARTHDATA_PASSWORD=...
OPENTOPOGRAPHY_API_KEY=...
METEOMATICS_USERNAME=...
METEOMATICS_PASSWORD=...
```

---

## 4. How to get the data

Example for NASA POWER (monthly data at the parcel centre):

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

Scripts in `scripts/`:

| Script | What it does |
|---|---|
| `fetch_power.py` | Downloads POWER monthly data for a latitude and longitude |
| `fetch_imerg.py` | Downloads and aggregates IMERG rainfall |
| `fetch_smap.py` | Downloads and aggregates SMAP soil moisture |
| `fetch_ndvi.py` | Downloads and aggregates MODIS NDVI |
| `build_monthly.py` | Merges everything into one monthly file per zone |

Each download records its **download date** and the **dataset version** in the file metadata or in a log.

---

## 5. Processing

1. **Common time step**: everything is brought to a **monthly** step.
2. **Common grid**: values are attached to the grid cell that contains the parcel centre. Finer data are averaged; coarser data are read as they are.
3. **Units**: POWER precipitation is in mm/day, so it is multiplied by the number of days in the month to get mm/month.
4. **Missing values**: the POWER value `-999` means "no data" and is excluded from every average. The annual mean stored under month key `13` in POWER monthly output is ignored.
5. **Climatology**: the mean of each calendar month across years gives 12 values per variable. This is the baseline used for anomalies (soil moisture, NDVI) and for the trend model.

---

## 6. Produced files (data contract)

### `processed/climate_monthly_<zone>.csv`

| Column | Unit | Description |
|---|---|---|
| `zone_id` | none | Identifier of the zone or grid cell |
| `lat`, `lon` | degrees | Parcel centre used for the query |
| `year`, `month` | none | Calendar year and month |
| `t2m_c` | °C | Mean air temperature at 2 m |
| `t2m_max_c`, `t2m_min_c` | °C | Monthly maximum and minimum temperature |
| `precip_mm_month` | mm | Rainfall total |
| `rh2m_pct` | % | Relative humidity at 2 m |
| `solar_kwh_m2_day` | kWh/m²/day | Surface shortwave downward irradiance |
| `soil_moisture` | m³/m³ | SMAP surface soil moisture |
| `ndvi` | none | Vegetation index (−1 to 1) |

These column names are the contract between the data pipeline, the backend and the core engine.

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
| `sol_prefere` | Preferred soil texture and drainage |
| `cycle_jours_min`, `cycle_jours_max` | Cycle length (days) |
| `saison_semis` | Sowing season |
| `role_rotation` | Role in a rotation |
| `fixe_azote` | Nitrogen-fixing crop (yes/no) |
| `source` | Where the values come from (FAO EcoCrop, FAO Crop Calendar, FAO-56) |
| `statut` | Verification status of the row |

These are general values for each crop. Local varieties and practices can differ, so the farmer's own input always takes priority in the app.

### Region extension

One crop file per region (`crops_<region>.csv`) plus a seasonal calendar. The climate pipeline does not change.

---

## 7. Quality and limitations

- NASA POWER is coarse (tens of kilometres): two neighbouring parcels often get the same values. It describes the **zone**, not the parcel.
- SMAP measures the **surface layer** only, not the root zone.
- Clouds can reduce usable NDVI images in the tropics.
- Satellite products are **estimates**; the farmer's own observations take priority when they differ.
- Crop-table values are general references per crop, not measurements on a given parcel.
- No local yield data is available, so AgriRot estimates risks and does not forecast yields.

---

## 8. Size and Git

- `raw/` is listed in `.gitignore`; the scripts recreate it.
- The repository keeps only the small files needed to run the demo (`samples/`) and the crop table.
- Large files are not committed.


## 9. Licences and credits

- NASA POWER data are provided by the NASA Langley Research Center POWER Project.
- SMAP data are distributed by the NASA NSIDC DAAC. MODIS data are distributed by the NASA LP DAAC. IMERG data are distributed by the NASA GES DISC. SRTM data are distributed through OpenTopography.
- Each provider's terms of use and citation guidance apply to its data.
- No NASA logos are used in the project.
- FAO sources are credited to FAO and used under their terms of use. The repository contains only parameter values derived from them, not FAO datasets.


## 10. Use of AI

Parts of the scripts, the processing logic, the first draft of the crop table and this documentation were prepared with the help of an AI assistant, then reviewed by the team.



