/**
 * Aperçu local du recalcul des stratégies (curseurs « Et si… » et modification d'une culture).
 * Simplification visuelle pour la maquette : le calcul de référence est fait par agrorot_core
 * via POST /parcels/{id}/strategies. À remplacer par l'appel API en phase 3.
 */
import type { ClimateScenario, Strategy, StrategyType } from "@/lib/types";
import { CROP_BY_ID } from "./crops";

export type Overrides = Partial<Record<StrategyType, Record<number, string>>>;

/** Sensibilité de chaque stratégie (aperçu) : pénalité par % de pluie en moins et par °C. */
const SENSITIVITY: Record<StrategyType, { drought: number; heat: number }> = {
  existing: { drought: 0.5, heat: 4 },
  recommended: { drought: 0.3, heat: 2.5 },
  alternative: { drought: 0.12, heat: 1.5 },
};

export type Transition = "R1" | "R2" | null;

export function transitions(seq: string[]): Transition[] {
  return seq.map((id, i) => {
    if (i === 0) return null;
    const cur = CROP_BY_ID[id];
    const prev = CROP_BY_ID[seq[i - 1]];
    if (!cur || !prev) return null;
    if (cur.family === prev.family) return "R1";
    if (cur.family === "Fabaceae" && (prev.family === "Poaceae" || prev.demanding)) return "R2";
    return null;
  });
}

function avg(seq: string[]) {
  return seq.reduce((sum, id) => sum + (CROP_BY_ID[id]?.baseScore ?? 60), 0) / seq.length;
}

export function effectiveTemp(s: ClimateScenario) {
  return s.temp_delta_c + (s.horizon_years === 5 ? 0.4 : s.horizon_years === 10 ? 0.9 : 0);
}

export interface SimulatedStrategy {
  base: Strategy;
  sequence: string[];
  modified: Record<number, boolean>;
  transitions: Transition[];
  score: number;
  resilience: number;
  collapsed: string[];
  nonViable: boolean;
}

export function simulate(
  strategies: Strategy[],
  scenario: ClimateScenario,
  overrides: Overrides,
): SimulatedStrategy[] {
  const t = effectiveTemp(scenario);
  return strategies.map((s) => {
    const original = s.sequence.map((e) => e.crop_id);
    const ov = overrides[s.id] ?? {};
    const seq = original.map((id, i) => ov[i] ?? id);
    const r0 = transitions(original);
    const r = transitions(seq);
    const count = (arr: Transition[], k: Transition) => arr.filter((x) => x === k).length;
    const delta =
      (count(r, "R2") - count(r0, "R2")) * 8 -
      (count(r, "R1") - count(r0, "R1")) * 25 +
      (avg(seq) - avg(original));
    const sens = SENSITIVITY[s.id];
    const rain = scenario.rain_delta_pct;
    const penalty = (rain < 0 ? -rain * sens.drought : rain * 0.08) + t * sens.heat;
    const collapsed = seq.filter((id) => t > (CROP_BY_ID[id]?.heatLimit ?? 99));
    const score = Math.max(0, Math.min(100, s.score + delta - penalty - collapsed.length * 12));
    const resilience = Math.max(0.3, s.resilience_index - (count(r, "R1") - count(r0, "R1")) * 0.06);
    return {
      base: s,
      sequence: seq,
      modified: Object.fromEntries(Object.keys(ov).map((k) => [Number(k), true])),
      transitions: r,
      score,
      resilience,
      collapsed: Array.from(new Set(collapsed)),
      nonViable: collapsed.length === seq.length,
    };
  });
}
