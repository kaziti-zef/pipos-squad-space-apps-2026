# 13 — Limitations, Risks and Future Work

## Limitations
- Challenge resources on soil, crops and yields are American. Without equivalent data elsewhere, model calibration relies on the US; NASA indicators are global.
- Planned improvement: integrate soil, crop and yield data from other countries so the model is not limited to a general case.
- **No local yield data in Cameroon**: scores are estimates to be validated with farmers and agronomists.
- **Climate precision**: NASA POWER describes a ~50 km grid; local relief, lowlands or nearby forest can differ — hence monthly farmer corrections of rain and temperature.
- **Crop table**: values from international databases (ECOCROP, FAO-56); some are estimated and flagged "to verify"; validate with IRAD or similar.
- **Not modeled**: market prices, day-to-day labor, local varieties, intercropping within a season.
- Human judgment stays: the tool proposes, explains and alerts; farmer and advisor decide.
- Forecast uncertainty must be displayed; no plot-scale precision promised.
- The error margins were not provided, leading to a little uncertainty.
- Soil texture may vary from the provided data.

## Future work
- Sentinel-2 and NAIP: field boundaries, bare-soil periods, crop identification and satellite-map validation with computer vision (segmentation, detection) — discarded for volume and time.
- GRACE-FO (water reserves), ECOSTRESS (stress hot spots), GEDI (biomass), NEX-GDDP-CMIP6 projections for multi-year horizons.
- Learn preferences and yields from farmer feedback.
- Move SQLite to PostgreSQL; add data from other regions (`crops_<region>.csv`).

## Risks and verifications
- Crop-table values to verify row by row; thresholds, weights, bonuses and penalties are to be calibrated and validated by an agronomist.
- Raster volume (SMAP, MODIS) and download time: start with the pilot.
- Exact POWER API format (addresses, parameters, monthly keys) and Earthdata access for IMERG, SMAP, NDVI.
- Exact submission closing time and video format.
