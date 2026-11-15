/**
 * Historique partagé d'une parcelle (CU12).
 * Combine GET /parcels/{id}/strategies/saved (+ notes) et GET /parcels/{id}/history.
 */
import type { ConfidenceLevel, NoteKind, Role, StrategyType } from "@/lib/types";

export interface HistoryNote {
  author: string;
  role: Role;
  kind: NoteKind;
  text: string;
  created_at: string;
}

export interface SavedStrategyEntry {
  kind: "strategy";
  id: string;
  saved_at: string;
  saved_by: string;
  saved_by_role: Role;
  strategy_id: StrategyType;
  name: string;
  score: number;
  confidence?: ConfidenceLevel;
  scenario?: string;
  sequence?: string[];
  outdated_geometry: boolean;
  outdated_note?: string;
  notes: HistoryNote[];
}

export interface SeasonEntry {
  kind: "season";
  id: string;
  seasons: string;
  sown_at?: string;
  crop_ids: string[];
  warning?: string;
  notes: HistoryNote[];
}

export type HistoryEntry = SavedStrategyEntry | SeasonEntry;

export const history: HistoryEntry[] = [
  {
    kind: "strategy",
    id: "hist_89",
    saved_at: "14/11/2026",
    saved_by: "Jean Mbarga",
    saved_by_role: "owner",
    strategy_id: "recommended",
    name: "Équilibre & santé du sol",
    score: 84.5,
    confidence: "élevée",
    scenario: "pluie −15 %, +1,5 °C",
    sequence: ["mais", "niebe", "manioc", "arachide", "mais", "patate_douce"],
    outdated_geometry: false,
    notes: [
      {
        author: "A. Fouda",
        role: "advisor",
        kind: "validation",
        text: "Validé lors de la visite terrain. Prévoir un labour léger avant le semis de S1.",
        created_at: "14/11/2026 12:05",
      },
      {
        author: "Jean Mbarga",
        role: "owner",
        kind: "observation",
        text: "Labour léger avant le semis de S1.",
        created_at: "14/11/2026 11:38",
      },
    ],
  },
  {
    kind: "season",
    id: "season_2026_s2",
    seasons: "Saison 2026-S2",
    sown_at: "03/09/2026",
    crop_ids: ["manioc"],
    notes: [
      {
        author: "Paul Essomba",
        role: "co_farmer",
        kind: "observation",
        text: "Boutures bien reprises malgré 10 jours sans pluie fin septembre.",
        created_at: "02/10/2026",
      },
    ],
  },
  {
    kind: "strategy",
    id: "hist_42",
    saved_at: "02/03/2026",
    saved_by: "Jean Mbarga",
    saved_by_role: "owner",
    strategy_id: "alternative",
    name: "Alternative résilience hydrique",
    score: 76,
    outdated_geometry: true,
    outdated_note: "Calculée sur l'ancien contour de la parcelle (4,2 ha). Relancez un calcul pour comparer.",
    notes: [],
  },
  {
    kind: "season",
    id: "season_2025_s2",
    seasons: "Saisons 2025-S2 et 2026-S1",
    crop_ids: ["mais", "mais"],
    warning: "Même famille deux saisons de suite (R1).",
    notes: [
      {
        author: "Jean Mbarga",
        role: "owner",
        kind: "observation",
        text: "Rendement en baisse sur la deuxième saison de maïs.",
        created_at: "15/07/2026",
      },
    ],
  },
];
