# AgriRot

**AgriRot – smart crop rotation for healthier soils.**
A decision-support tool that helps farmers plan long-term crop rotations using NASA Earth observation data, local soil information and their own priorities, and adapts the plan as conditions change.

NASA International Space Apps Challenge 2026 – *The Next Frontier*
Challenge: **Field Shift: Adapting Farms with NASA Data**
Team: **Pipos Squad**

---

## The problem

Farmers around the world are navigating changing temperatures and rainfall patterns, water shortages, extreme weather and declining soil health. These pressures make it hard to choose crop rotations that protect fields, conserve water and stay resilient over the long term.

## Our solution

AgriRot is a web application that helps **crop farmers** decide **which crops to plant, and in what order**, on their own plot. It combines NASA Earth observations, local information about the soil, the characteristics of each crop and the farmer's own priorities, and it keeps the plan up to date as conditions change.

AgriRot is **global by design**. Its first configuration is Cameroon, because that is where the crop table and the seasonal calendar were built. Other regions are added progressively by adding their own datasets, without rebuilding the tool.

### How it works

1. **Delimit the plot.** The farmer draws the boundary of the plot on a map.
2. **Review the known data.** The data available for this area (for example rainfall, temperature, soil moisture) is displayed. The farmer confirms or corrects it.
3. **Add local knowledge.** The farmer tells us what we cannot observe from space, for example "the land is arid, but I have a way to irrigate".
4. **Set preferences.** The farmer can name the crops they want, or exclude some ("anything except okra").
5. **Get a suitability score for each crop.** A scoring system rates how well each crop fits the conditions of the plot, and how it affects the soil and the crops that follow.
6. **Get a long-term rotation plan.** A machine learning model forecasts future conditions, and the application proposes a multi-season rotation plan.
7. **Edit the plan and recalculate.** The farmer can change the plan, for example replace groundnut with bean. If the new crop is harmful for a later one (bean can hurt the plantain that follows), the application rearranges the order, for example by moving the plantain earlier, and recalculates.
8. **Stay adaptive.** As time passes and new data arrive, forecasts are updated and the plan can be revised, so it never stays frozen on past data.

## How this answers the challenge

| What the challenge asks | What our tool does |
|---|---|
| Use NASA observations of the Earth | Climate and soil-moisture observations for the plot feed the suitability scores and the forecasts |
| Use local information on soils | The farmer confirms the known data and adds local conditions such as irrigation or aridity |
| Take crop characteristics into account | Each crop has favourable and unfavourable conditions, and effects on the soil and on the next crop |
| Take farmers' priorities into account | Crops wanted or excluded, and plan edits chosen by the farmer |
| Explore rotation strategies that strengthen soil health | A multi-season plan that rewards helpful crop sequences and penalises harmful ones |
| Adapt farms to changing conditions | Forecasts under several climate scenarios, with the plan recalculated as conditions evolve |

## The model

The model combines, in a single score, the suitability of each crop to the conditions, the effect of one crop on the next, the effect on soil health, risk under different climate scenarios and the farmer's preferences. The best sequence of crops is found by dynamic programming, which allows the plan to be recalculated instantly after every change.

The full model, with its assumptions and limits, is in [`docs/modele_mathematique.pdf`](docs/methodology.md).

## NASA data used

| Source | Variables | What it is used for |
|---|---|---|
| [NASA POWER](https://power.larc.nasa.gov/) ([API documentation](https://power.larc.nasa.gov/docs/services/api/)) | Air temperature (mean, maximum, minimum), rainfall, relative humidity, solar radiation, monthly since 1981 | Matching each crop to its climate range, heat stress, disease-risk indicator, long series for the trend forecast |
| [GPM IMERG](https://giovanni.gsfc.nasa.gov/) (via Giovanni) | Precipitation | Monthly rainfall, heavy-rain days, year-to-year variability, start of the rainy seasons |
| [SMAP SPL3SMP_E](https://nsidc.org/data/spl3smp_e) | Surface soil moisture | Water-stress signal compared with the local normal |
| [MODIS MOD13Q1 v061](https://lpdaac.usgs.gov/products/mod13q1v061/) (via [AppEEARS](https://appeears.earthdatacloud.nasa.gov/)) | NDVI | Vegetation vigour, crop cycles, bare-soil periods |
| [SRTM](https://opentopography.org/) (via OpenTopography) | Elevation, slope | Erosion and runoff risk |

Access to NASA Earthdata uses [NASA Earthdata Login](https://urs.earthdata.nasa.gov/).

Other resources:

- **FAO**: [EcoCrop](https://gaez.fao.org/pages/ecocrop), [Crop Calendar](https://cropcalendar.apps.fao.org/) and [FAO-56](https://www.fao.org/3/x0490e/x0490e00.htm) for crop requirements, calendars, crop coefficients and water balance, together with FAO-33 (yield response to water).
- **Methods**: RUSLE for soil-erosion risk and Rank Order Centroid weighting for the farmer's priorities.
- **Weather forecasts**: [Meteomatics](https://www.meteomatics.com/en/api/) and [Open-Meteo](https://open-meteo.com/en/docs).

Full details on every dataset, the processing steps and the crop table (26 crops, 47 columns) are in [`data/README.md`](data/README.md).

## Tools and technologies

- **Model and data pipeline**: Python (numpy, pandas, requests), dynamic programming for the rotation search, scikit-learn for the forecasts.
- **Web application**: React with Vite and Tailwind CSS, with Leaflet and OpenStreetMap for the map and plot drawing, and a Python FastAPI backend with SQLAlchemy.
- **Data services**: NASA POWER API, AppEEARS, Giovanni, OpenTopography, Meteomatics and Open-Meteo.

## Intended users

Crop farmers (smallholders and larger growers) who plan what to plant, and when, on their own plots. The tool does not cover livestock.

## Impact

AgriRot helps farmers choose rotations that protect the soil, save water and stay resilient as the climate shifts. It turns NASA satellite data into simple, explained advice and leaves the final decision to the farmer. Its first users are crop farmers in Cameroon, and its design allows other regions to follow.

## Current scope and limits

- **Region**: Cameroon is the first configuration, around the outskirts of Yaoundé. Other regions need their own crop table and seasonal calendar.
- **Crops**: 26 crops common in Cameroon, with general reference values for each crop.
- **Data**: NASA POWER describes a zone of tens of kilometres, not a single parcel. SMAP measures the surface soil layer only. Satellite products are estimates, so the farmer's own observations take priority when they differ.
- **What it does not do**: AgriRot estimates risks. It does not diagnose diseases, forecast yields precisely or replace the farmer's judgment and local expertise.
- **Simplifications**: parameter values and weights are starting conventions, to be refined with local experts.

The main assumptions and limits of the model are described in the model document.

## Next steps

- More crops and more regions, by adding datasets progressively.
- Additional NASA data such as ECOSTRESS, GRACE-FO and GEDI.
- Learning from farmers' feedback and real yields.
- Disease-risk estimates from photos and yield forecasts.
- Offline mode and field sensors for local soil moisture.

## Team

**Pipos Squad**

- ESSIANE ESSA'A Lorenzo Alan
- KAZITI DIZEKETI Simon-Pierre
- KETCHEMEN TCHOUNKEU Kevin
- MBA Bela Oceanne
- TIPA TCHOUANNOUO Iness Adreine
- WAMBA NANFACK Alex

## Resources

- Model document: [`docs/modele_mathematique.pdf`](docs/methodology.md)
- Data documentation: [`data/README.md`](data/README.md)
- - Crop table overview: [`data/README.md`](data/README.md#cropsfiche_culturecsv)
- Full crop table (CSV): [`data/crops/fiche_culture.csv`](data/crops/fiche_culture.csv)

## Use of AI

Parts of the code, the data processing, the first draft of the crop table and the documentation were prepared with the help of an AI assistant, then reviewed by the team.

## License

This project is released under the MIT License. See [`LICENSE`](LICENSE).
