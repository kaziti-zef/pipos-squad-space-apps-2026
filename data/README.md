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
│   └── fiche_culture.csv   <- crop table (26 crops)
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
| [FAO-56, Crop evapotranspiration](https://www.fao.org/3/x0490e/x0490e00.htm) (Allen et al., 1998) | Crop water requirement, crop coefficients (Kc), growth-stage lengths and water balance |
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

### `crops/fiche_culture.csv`

The crop table: **26 crops** common in Cameroon, **47 columns**, one row per crop. It covers cereals, legumes, roots and tubers, vegetables, leafy vegetables, cash crops, and perennial and fruit trees. The file is UTF-8 with a comma separator; with pandas, read it with `encoding="utf-8-sig"`.

```python
import pandas as pd
crops = pd.read_csv("data/crops/fiche_culture.csv", encoding="utf-8-sig")
```

**Overview** (optimal ranges; temperature in °C, rainfall in mm, cycle in days):

| Crop | Scientific name | Family | Category | Temp. | Rainfall | Cycle | N-fixing |
|---|---|---|---|---|---|---|---|
| Maïs | *Zea mays* | Poaceae | Céréale | 18–33 | 600–1200 | 110 | Non |
| Manioc | *Manihot esculenta* | Euphorbiaceae | Racine / tubercule | 20–29 | 1000–1500 | 365 | Non |
| Arachide | *Arachis hypogaea* | Fabaceae | Légumineuse | 22–32 | 600–1500 | 105 | Oui |
| Haricot commun | *Phaseolus vulgaris* | Fabaceae | Légumineuse | 16–25 | 500–2000 | 90 | Oui |
| Niébé | *Vigna unguiculata* | Fabaceae | Légumineuse | 25–35 | 500–1500 | 80 | Oui |
| Banane plantain | *Musa acuminata x balbisiana* | Musaceae | Racine / tubercule et fruit (semi-pérenne) | 25–35 | 1400–2400 | 390 | Non |
| Tomate | *Solanum lycopersicum* | Solanaceae | Maraîchage | 20–27 | 600–1300 | 120 | Non |
| Gombo | *Abelmoschus esculentus* | Malvaceae | Maraîchage | 20–30 | 600–1200 | 90 | Non |
| Igname | *Dioscorea rotundata* | Dioscoreaceae | Racine / tubercule | 25–32 | 1000–1500 | 240 | Non |
| Patate douce | *Ipomoea batatas* | Convolvulaceae | Racine / tubercule | 18–28 | 750–2000 | 120 | Non |
| Piment | *Capsicum frutescens* | Solanaceae | Maraîchage | 18–30 | 600–1500 | 150 | Non |
| Oignon | *Allium cepa* | Amaryllidaceae | Maraîchage | 12–25 | 350–600 | 130 | Non |
| Macabo | *Xanthosoma sagittifolium* | Araceae | Racine / tubercule | 20–28 | 1000–2000 | 300 | Non |
| Cacao | *Theobroma cacao* | Malvaceae | Rente (pérenne) | 21–32 | 1200–3000 | – | Non |
| Banane douce | *Musa acuminata* | Musaceae | Fruit (semi-pérenne) | 23–33 | 1200–3600 | 390 | Non |
| Coton | *Gossypium hirsutum* | Malvaceae | Rente | 22–36 | 750–1200 | 160 | Non |
| Palmier à huile | *Elaeis guineensis* | Arecaceae | Rente (pérenne) | 20–35 | 1500–3000 | – | Non |
| Riz | *Oryza sativa* | Poaceae | Céréale | 20–30 | 1500–2000 | 120 | Non |
| Sésame | *Sesamum indicum* | Pedaliaceae | Rente / oléagineux | 20–30 | 500–1000 | 100 | Non |
| Ndolè | *Vernonia amygdalina* | Asteraceae | Légume-feuille (arbustif) | 20–26 | 750–2000 | 90 | Non |
| Folon (amarante) | *Amaranthus hybridus* | Amaranthaceae | Légume-feuille | 12–30 | 400–600 | 45 | Non |
| Soja | *Glycine max* | Fabaceae | Légumineuse | 20–33 | 600–1500 | 110 | Oui |
| Manguier | *Mangifera indica* | Anacardiaceae | Fruitier (pérenne) | 24–30 | 600–1500 | – | Non |
| Goyavier | *Psidium guajava* | Myrtaceae | Fruitier (pérenne) | 20–33 | 1000–3000 | – | Non |
| Avocatier | *Persea americana* | Lauraceae | Fruitier (pérenne) | 14–40 | 500–2000 | – | Non |
| Papayer | *Carica papaya* | Caricaceae | Fruitier (semi-pérenne) | 21–30 | 1500–2500 | 270 | Non |

**Columns**

| Group | Columns | Meaning |
|---|---|---|
| Identity | `id`, `culture`, `nom_scientifique`, `famille`, `categorie`, `type_cycle` | Crop identifier and name, botanical family (used by the rotation rules), category and cycle type (annual, long-cycle, perennial) |
| Rotation | `entre_en_rotation`, `delai_retour_ans`, `fixe_azote`, `azote_fixe_kg_ha`, `besoin_azote`, `residus`, `couverture_sol` | Whether the crop can enter a rotation, minimum years before the same crop or family returns, nitrogen fixation and nitrogen need, crop residues and ground cover |
| Temperature | `t_opt_min_c`, `t_opt_max_c`, `t_abs_min_c`, `t_abs_max_c` | Optimal and absolute temperature limits (°C) |
| Rainfall and altitude | `pluie_opt_min_mm`, `pluie_opt_max_mm`, `pluie_abs_min_mm`, `pluie_abs_max_mm`, `altitude_max_m` | Optimal and absolute rainfall limits (mm) and maximum altitude (m), from FAO EcoCrop |
| Water use | `kc_ini`, `kc_mid`, `kc_fin`, `sensibilite_secheresse` | FAO-56 crop coefficients (Kc) for the initial, mid and end stages, and drought sensitivity |
| Growth stages | `duree_cycle_jours`, `stade_initial_j`, `stade_developpement_j`, `stade_mi_saison_j`, `stade_fin_j` | Cycle length and length of each growth stage (days) |
| Soil | `ph_opt_min`, `ph_opt_max`, `texture_optimale`, `drainage`, `profondeur_sol_requise`, `profondeur_racines_m` | Preferred pH, texture, drainage, required soil depth and rooting depth (m) |
| Health | `ravageurs_maladies_majeurs`, `sensibilite_nematodes` | Major pests and diseases, and nematode sensitivity (used for disease-risk indicators) |
| Use and place | `usages`, `zone_typique_cameroun` | Main uses and typical growing zones in Cameroon |
| Calendar | `semis_saison_A`, `recolte_saison_A`, `semis_saison_B`, `recolte_saison_B` | Sowing and harvest windows for the two rainy seasons, reserved for the regional seasonal calendar |
| Notes and sources | `a_verifier`, `sources` | Notes and assumptions for each row (for example when a Kc or a stage length is estimated because FAO-56 has no value for the crop), and the sources of the values |

Parameters come from FAO EcoCrop (climate and soil), FAO-56 (Kc and growth stages) and agronomic literature (nitrogen, roots, pests, uses). These are general values for each crop. Local varieties and practices can differ, so the farmer's own input always takes priority in the app.

### Region extension

One crop file per region (`fiche_culture_<region>.csv`) plus a seasonal calendar. The climate pipeline does not change.

---

## 7. Quality and limitations

- NASA POWER is coarse (tens of kilometres): two neighbouring parcels often get the same values. It describes the **zone**, not the parcel.
- SMAP measures the **surface layer** only, not the root zone.
- Clouds can reduce usable NDVI images in the tropics.
- Satellite products are **estimates**; the farmer's own observations take priority when they differ.
- Crop-table values are general references per crop, not measurements on a given parcel. Where FAO-56 has no value for a crop (for example okra, yam or cocoyam), the Kc and the stage lengths are estimates, noted in the `a_verifier` column.
- No local yield data is available, so AgriRot estimates risks and does not forecast yields.

---

## 8. Size and Git

- `raw/` is listed in `.gitignore`; the scripts recreate it.
- The repository keeps only the small files needed to run the demo (`samples/`) and the crop table.
- Large files are not committed.

---

## 9. Licences and credits

- NASA POWER data are provided by the NASA Langley Research Center POWER Project.
- SMAP data are distributed by the NASA NSIDC DAAC. MODIS data are distributed by the NASA LP DAAC. IMERG data are distributed by the NASA GES DISC. SRTM data are distributed through OpenTopography.
- Each provider's terms of use and citation guidance apply to its data.
- Crop parameters come from FAO EcoCrop, FAO-56 and agronomic literature, as listed in the `sources` column of the crop table.
- No NASA logos are used in the project.
- FAO sources are credited to FAO and used under their terms of use. The repository contains only parameter values derived from them, not FAO datasets.

---

## 10. Use of AI

Parts of the scripts, the processing logic, the first draft of the crop table and this documentation were prepared with the help of an AI assistant, then reviewed by the team.

---

