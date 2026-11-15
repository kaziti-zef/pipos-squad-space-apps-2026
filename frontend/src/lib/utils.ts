import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Nombre au format de la langue : 84.5 → « 84,5 » (fr) ou « 84.5 » (en). */
/** Nombre formaté ; « — » quand la valeur manque (l'API peut renvoyer null, guide §8.5). */
export function fr(value: number | null | undefined, digits = 1, lang: "fr" | "en" = "fr"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString(lang === "en" ? "en-GB" : "fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** Valeur signée : 5 → « +5 », -3 → « −3 ». */
export function signed(value: number | null | undefined, digits = 1, lang: "fr" | "en" = "fr"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (value > 0) return `+${fr(value, digits, lang)}`;
  if (value < 0) return `−${fr(Math.abs(value), digits, lang)}`;
  return fr(0, digits, lang);
}

export type Level = "élevée" | "moyenne" | "faible";

export function confidenceLevel(score: number): Level {
  if (score >= 0.8) return "élevée";
  if (score >= 0.6) return "moyenne";
  return "faible";
}

export type StabilityLevel = 1 | 2 | 3;

export function stabilityLevel(resilience: number): StabilityLevel {
  if (resilience >= 0.85) return 3;
  if (resilience >= 0.7) return 2;
  return 1;
}

export const STABILITY_LABEL: Record<StabilityLevel, string> = {
  1: "Faible",
  2: "Bonne",
  3: "Très bonne",
};

/** Couleur d'un score 0–100 (charte §2, seuils de lecture). */
export function scoreColor(score: number): string {
  if (score >= 75) return "var(--color-forest-700)";
  if (score >= 50) return "var(--color-score-mid)";
  return "var(--color-danger-600)";
}
