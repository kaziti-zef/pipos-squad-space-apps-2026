# 10 — Frontend and UX Specification

## Stack
React + Vite (or Vue), Tailwind CSS, Leaflet + Leaflet.draw + OpenStreetMap, Recharts or Chart.js, browser geolocation (HTTPS required), PWA manifest to install on a phone.

## HCI principles
Readability, visual feedback, simple vocabulary, consistency, error prevention, accessibility (contrast, touch targets), mobile-first. Loading, error and missing-data states are always designed.

## Journey
1. Choose the plot → 2. See the diagnostic → 3. Enter priorities → 4. Compare strategies.

## Screens
- **Dashboard**: list of farms and plots; map with saved outlines.
- **Plot sheet**: monthly charts (temperature, rain, soil moisture, NDVI) vs. normal; risk periods (water stress, bare soil).
- **History**: crops and dates per season, farmer notes, compared and chosen strategies with date.
- **Exploration**: filters by plot, season, variable; scenario sliders; crop change with recompute.
- **Sharing**: several farmers on one farm share the same history.
- **Export**: printable strategy sheet or PDF.
- **Transparency**: "How to read these results" screen, data source per item, confidence level, permanent reminder that the tool does not replace local expertise.
- **Maps** (optional): soil moisture, water stress, erosion, frost with time slider.

## Strategy page
Three strategies side by side with name, score, confidence, season-by-season crop sequence, resilience, and the five explanation sections. One-sentence tooltips for scientific terms.
