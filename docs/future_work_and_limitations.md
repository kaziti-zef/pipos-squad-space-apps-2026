# 13 — Limitations, Risks and Future Work

## Limits to state in the report
- Challenge resources on soil, crops and yields are American. Without equivalent data elsewhere, model calibration relies on the US; NASA indicators are global.
- Planned improvement: integrate soil, crop and yield data from other countries so the model is not limited to a general case.
- **No local yield data in Cameroon**: scores are estimates to be validated with farmers and agronomists.
- **Climate precision**: NASA POWER describes a ~50 km grid; local relief, lowlands or nearby forest can differ — hence monthly farmer corrections of rain and temperature.
- **Crop table**: values from international databases (ECOCROP, FAO-56); some are estimated and flagged "to verify"; validate with IRAD or similar.
- **Not modeled**: market prices, day-to-day labor, local varieties, intercropping within a season.
- Human judgment stays: the tool proposes, explains and alerts; farmer and advisor decide.
- Forecast uncertainty must be displayed; no plot-scale precision promised.

## Future work
- Sentinel-2 and NAIP: field boundaries, bare-soil periods, crop identification and satellite-map validation with computer vision (segmentation, detection) — discarded for volume and time.
- GRACE-FO (water reserves), ECOSTRESS (stress hot spots), GEDI (biomass), NEX-GDDP-CMIP6 projections for multi-year horizons.
- Learn preferences and yields from farmer feedback.
- Move SQLite → PostgreSQL; add data from other regions (`crops_<region>.csv`).

## Risks and points to verify
- Crop-table values to verify row by row; thresholds, weights, bonuses and penalties to calibrate and have validated by an agronomist.
- Raster volume (SMAP, MODIS) and download time: start with the pilot.
- Exact POWER API format (addresses, parameters, monthly keys) and Earthdata access for IMERG, SMAP, NDVI.
- The acronym "SI" in the challenge text is undefined in the excerpts seen; treated as the model part — confirm with a challenge expert.
- Exact submission closing time and video format.
