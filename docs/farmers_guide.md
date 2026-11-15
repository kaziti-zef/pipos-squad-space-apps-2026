# 11 — Farmer Guide: How AgroRot Proposes a Rotation

## In one sentence
AgroRot compares your current rotation with thousands of others, removes those that break an agronomic rule, scores the rest on six criteria using 30 years of NASA data and your inputs, and presents the best ones with reasons and figures.

## What a rotation is
The order in which crops follow each other on the same plot, season after season. A good rotation keeps soil fertile, breaks disease cycles, protects against erosion and reduces water risk. A bad one (maize after maize) exhausts the soil and feeds the same pests.

## The three rotations shown
| Rotation | Meaning |
|----------|---------|
| Current (reference) | What you do today; the comparison point |
| Recommended | Best rotation found given your priorities |
| Alternative | Another very good rotation, truly different, for a real choice |

Each gets a score out of 100, six sub-scores (climate, water, fertility, erosion, diseases, priorities), a resilience index, a confidence level and plain-language explanations.

## What the tool is not
- Not a black-box AI: it is a set of published agronomic rules (FAO, NASA); every score can be recomputed by hand.
- Not a replacement for a local agronomist: it proposes, you and your advisor decide.
- Not a weather forecast: it judges a rotation on the last 30 years of climate, then tests it under harsher climates.

## Vocabulary
| Word | Meaning |
|------|---------|
| Seasons S1 / S2 | Yaoundé has two rainy seasons: S1 (sow in March, rains until June), S2 (sow in August, rains until November). 6 seasons = 3 years |
| Long crop | 200+ days (cassava, yam); spans several seasons, shown as "continued" |
| Fallow | Resting season, no crop |
| Service plant | Sown for the soil, not the harvest (mucuna, crotalaria) |
| Legume | Fixes nitrogen from the air (groundnut, cowpea, bean, soybean, mucuna) |
| Botanical family | Same family often means same diseases; avoid chaining them |
| ET0 | Reference evapotranspiration: water the air "pumps" from soil and plants (mm/day) |
| Kc | Crop coefficient: a growing crop uses Kc × ET0 |
| Pest | Disease, insect, nematode or parasitic plant |

## Worked example: Mbankomo plot
Clay-loam soil, pH 5.8, slope ≈ 3°, no irrigation, history "maize, maize, cassava", priority "save water", okra excluded; ≈ 1,460 mm rain/year; 6 seasons.

| Rotation | Seasons 1–6 | S1 | S2 | S3 | S4 | S5 | S6 | Score | Resil. |
|----------|-------------|----|----|----|----|----|----|-------|--------|
| Current | maize, maize, cassava, (cont.), maize, cassava | 100 | 97 | 26 | 83 | 64 | 96 | 65 | 0.84 |
| Recommended | groundnut, maize, mucuna, maize, cassava, (cont.) | 100 | 99 | 48 | 85 | 81 | 82 | 85 | 0.88 |
| Alternative | maize, sweet potato, crotalaria, maize, cassava, (cont.) | 100 | 99 | 41 | 84 | 84 | 81 | 85 | 0.89 |

- Current: great for income but exhausts the soil (S3 = 26), feeds pests (S5 = 64), breaks return delays (−20 %).
- Recommended: legumes before maize; fertility nearly doubles, diseases recede, +20 points.
- Alternative: different choices for an equivalent score.
- If rain drops 30 % and temperature rises 2 °C, the current rotation falls to 50 while an adapted recommendation (cowpea, maize, mucuna, maize, cowpea, maize) keeps 85 — the "Field Shift" message.

## Your role
You can replace a crop by hand; the rotation is recomputed, rules broken are flagged and the score updates. You keep control.
