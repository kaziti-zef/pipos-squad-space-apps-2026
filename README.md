# pipos-squad-space-apps-2026
Decision-support tool that helps farmers plan long-term crop rotations using NASA Earth observation data, local soil information and their own priorities , and adapts the plan as conditions change
# AgroRot

**AgroRot – smart crop rotation for healthier soils.**
A decision-support tool for crop farmers, powered by NASA Earth observation data.

NASA Space Apps Challenge 2026 – *The Next Frontier*
Challenge: **« Changement de terrain : adapter les fermes avec les données de la NASA »** ([official English title of the challenge])
Team: [team name]

---

## The problem

Farmers around the world are navigating changing temperatures and rainfall patterns, water shortages, extreme weather and declining soil health. These pressures make it hard to choose crop rotations that protect fields, conserve water and stay resilient over the long term.

## Our solution

AgroRot is a web application that helps **crop farmers** decide **which crops to plant, and in what order**, on their own plot. It combines NASA Earth observations, local information about the soil, the characteristics of each crop and the farmer's own priorities, and it keeps the plan up to date as conditions change.

### How it works

1. **Delimit the plot.** The farmer draws the boundary of the plot on a map.
2. **Review the known data.** The data available for this area (for example rainfall, temperature, soil moisture) is displayed. The farmer confirms or corrects it.
3. **Add local knowledge.** The farmer tells us what we cannot observe from space, for example "the land is arid, but I have a way to irrigate".
4. **Set preferences.** The farmer can name the crops they want, or exclude some ("anything except okra").
5. **Get a suitability score for each crop.** A scoring system rates how well each crop fits the conditions of the plot, and how it affects the soil and the crops that follow.
6. **Get a long-term rotation plan.** A machine learning model forecasts future conditions, and the application proposes a multi-season rotation plan.
7. **Edit the plan and recalculate.** The farmer can change the plan, for example replace groundnut by bean. If the new crop is harmful for a later one (bean can hurt the plantain that follows), the application rearranges the order, for example by moving the plantain earlier, and recalculates.
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

The full model, with its assumptions and limits, is in [`docs/modele_mathematique.pdf`](docs/modele_mathematique.pdf).

## NASA data used

[List the exact datasets and variables retained, with links, and what each is used for.]

## Tools and technologies

[Languages, libraries, map and weather services, hosting.]

## Intended users

Crop farmers (smallholders and larger growers) who plan what to plant, and when, on their own plots. The tool does not cover livestock.

## Impact

[Who benefits, in which region, and how: for example better water use, healthier soils, more resilient yields.]

## Current scope and limits

[Describe honestly what the prototype covers: region, crops, data, forecasts. State what is simplified.]

The main assumptions and limits of the model are described in the model document. Parameter values and their sources will be documented in `docs/`.

## Next steps

[More crops, more regions, additional data, mobile access.]

## Team

[Names and roles.]

## Resources

- Demo video: []
- Live prototype: []
- Model document: [`docs/modele_mathematique.pdf`](docs/modele_mathematique.pdf)

## License

[MIT, to be added.]

---
