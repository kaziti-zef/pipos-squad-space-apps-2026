/**
 * Fausses données dans la langue demandée.
 * Avec l'API, ce contenu (noms et explications des stratégies, glossaire, notes) arrivera déjà traduit
 * grâce à l'en-tête Accept-Language (contrat d'API v2, §1). Ici, on superpose une version anglaise aux données françaises.
 */
import type { Locale } from "@/i18n/config";
import type { ClimateResponse, StrategiesResponse, StrategyExplanation, StrategyType } from "@/lib/types";
import { climate, parcels, strategies } from "./index";
import { history, type HistoryEntry } from "./history";

const STRATEGIES_EN: Record<StrategyType, { name: string; explanation: StrategyExplanation }> = {
  existing: {
    name: "Current rotation (baseline)",
    explanation: {
      why: ["Penalty (−25): the Poaceae family (maize) is repeated over two consecutive seasons (rule R1)."],
      proofs: ["NASA POWER: enough S2 rainfall, but a negative SMAP anomaly at the end of the cycle."],
      benefits: ["Guaranteed local market."],
      information_gaps: ["Organic matter level not provided (default value used)."],
      local_risks_to_check: ["Higher risk of stem borers and nitrogen depletion."],
    },
  },
  recommended: {
    name: "Balance & soil health",
    explanation: {
      why: [
        "Cowpea (a legume) restores nitrogen after maize (rule R2).",
        "Groundnut after cassava, a demanding crop, recharges the soil (rule R2).",
        "No botanical family repeated over two seasons (rule R1 met).",
        "Maize remains sensitive to water stress from December to February.",
      ],
      proofs: [
        "SMAP surface moisture compatible with cowpea's short cycle (75 days).",
        "NASA POWER: enough S2 rainfall; temperature within maize's optimal range.",
        "Your inputs: clay loam soil, pH 5.8, 3.2° slope confirmed, no irrigation.",
      ],
      benefits: [
        "Less nitrogen fertiliser thanks to 2 legumes.",
        "Short crops at the end of the rainy season.",
        "Groundnut and maize: local markets entered.",
        "Fast ground cover by sweet potato (R5).",
      ],
      information_gaps: ["Soil pH entered by hand (5.8) — to be confirmed by a test."],
      local_risks_to_check: [
        "Check that improved cowpea seeds are available before the 2027-S2 season.",
        "Groundnut is close to its waterlogging limit in the lowland: check drainage.",
      ],
    },
  },
  alternative: {
    name: "Water resilience",
    explanation: {
      why: ["Crops tolerant of the simulated rain drop (−15%); 100% of the crops differ from the recommended strategy."],
      proofs: ["NASA POWER and SRTM trends (3.2° slope) favour the creeping cover of sweet potato."],
      benefits: ["Stability index of 0.94: the score barely changes under the stress scenarios tested."],
      information_gaps: ["Post-harvest storage capacity not provided."],
      local_risks_to_check: ["Groundnut is sensitive to excess moisture in a poorly drained lowland."],
    },
  },
};

const GLOSSARY_EN: Record<string, string> = {
  evapotranspiration: "Water lost by the soil and the plants.",
  ndvi: "How vigorous the vegetation looks from the sky. Below 0.2 = bare soil; above 0.6 = dense vegetation.",
  soil_moisture_anomaly: "Difference between the current soil moisture and the normal.",
  water_balance: "Rain plus irrigation, minus what the crop needs.",
  frost_risk: "Probability of frost (almost zero in Yaoundé, useful elsewhere).",
  heat: "Temperature above the crop's upper limit: heat stress.",
};

const PARCELS_EN: Record<string, { current_crop: string; note: string }> = {
  pcl_55: { current_crop: "Maize growing", note: "Chosen on 14/11" },
  pcl_56: { current_crop: "Slope 9°", note: "No strategy" },
  pcl_57: { current_crop: "Tomato", note: "Chosen on 02/10" },
};

const HISTORY_EN: Record<string, Partial<Record<"name" | "scenario" | "outdated_note" | "warning" | "seasons", string>> & { notes?: string[] }> = {
  hist_89: {
    name: "Balance & soil health",
    scenario: "rain −15%, +1.5 °C",
    notes: ["Validated during the field visit. Plan a light ploughing before S1 sowing.", "Light ploughing before S1 sowing."],
  },
  season_2026_s2: { seasons: "Season 2026-S2", notes: ["Cuttings took well despite 10 days without rain at the end of September."] },
  hist_42: {
    name: "Water resilience alternative",
    outdated_note: "Calculated on the plot's previous outline (4.2 ha). Run a new calculation to compare.",
  },
  season_2025_s2: {
    seasons: "Seasons 2025-S2 and 2026-S1",
    warning: "Same family two seasons in a row (R1).",
    notes: ["Lower yield on the second maize season."],
  },
};

export function getStrategies(lang: Locale): StrategiesResponse {
  if (lang === "fr") return strategies;
  return {
    ...strategies,
    disclaimer:
      "Decision-support tool: these estimates support your judgement and do not replace the advice of a local agronomist.",
    strategies: strategies.strategies.map((s) => ({ ...s, ...STRATEGIES_EN[s.id] })),
  };
}

export function getClimate(lang: Locale): ClimateResponse {
  if (lang === "fr") return climate;
  return {
    ...climate,
    grid_resolution_note: "NASA POWER (55×70 km), SMAP (9 km), MODIS NDVI (250 m).",
    glossary: { ...climate.glossary, ...GLOSSARY_EN },
  };
}

export function getParcels(lang: Locale) {
  if (lang === "fr") return parcels;
  return parcels.map((p) => ({ ...p, ...PARCELS_EN[p.id] }));
}

export function getHistory(lang: Locale): HistoryEntry[] {
  if (lang === "fr") return history;
  return history.map((e) => {
    const tr = HISTORY_EN[e.id];
    if (!tr) return e;
    const notes = e.notes.map((n, i) => ({ ...n, text: tr.notes?.[i] ?? n.text }));
    if (e.kind === "strategy") {
      return {
        ...e,
        name: tr.name ?? e.name,
        scenario: tr.scenario ?? e.scenario,
        outdated_note: tr.outdated_note ?? e.outdated_note,
        notes,
      };
    }
    return { ...e, seasons: tr.seasons ?? e.seasons, warning: tr.warning ?? e.warning, notes };
  });
}
