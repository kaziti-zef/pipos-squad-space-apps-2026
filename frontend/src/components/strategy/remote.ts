"use client";
/**
 * Actions des cartes de stratégies quand le backend est branché (fournies par StrategiesLoader).
 * Absentes en mode démo : les vues gardent alors l'aperçu local (lib/domain/simulate.ts).
 */
import { createContext, useContext } from "react";
import type { StrategyType } from "@/lib/types";

export interface RemoteStrategies {
  /** Modifie une culture : recalcul serveur avec manual_overrides. `season` : rang 0..n-1. */
  setCrop: (id: StrategyType, season: number, crop: string) => void;
  /** Annule les modifications d'une stratégie (recalcul sans ses overrides). */
  undo: (id: StrategyType) => void;
  /** Sauvegarde la stratégie (POST …/strategies/save) puis ouvre l'historique. */
  retain: (id: StrategyType) => void;
  /** Lien vers le détail, avec l'identifiant du calcul (?c=…). */
  detailHref: (id: StrategyType) => string;
  busy: boolean;
  /** Cultures exclues dans les priorités : retirées des listes de choix. */
  excluded: string[];
}

export const RemoteStrategiesContext = createContext<RemoteStrategies | null>(null);

export function useRemoteStrategies() {
  return useContext(RemoteStrategiesContext);
}
