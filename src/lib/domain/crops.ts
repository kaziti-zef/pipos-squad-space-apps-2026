/** Catalogue régional cm_yaounde (aperçu frontend, la source de vérité est GET /crops). */

export type Family =
  | "Poaceae"
  | "Fabaceae"
  | "Euphorbiaceae"
  | "Convolvulaceae"
  | "Dioscoreaceae"
  | "Solanaceae"
  | "Musaceae"
  | "Malvaceae";

export interface CropInfo {
  id: string;
  name: string;
  family: Family;
  /** Score indicatif S(c) sur la parcelle de démonstration. */
  baseScore: number;
  /** Hausse de température (°C) au-delà de laquelle l'aptitude tombe à 0. */
  heatLimit: number;
  demanding: boolean;
}

export const CROPS: CropInfo[] = [
  { id: "mais", name: "Maïs", family: "Poaceae", baseScore: 72, heatLimit: 3.5, demanding: true },
  { id: "niebe", name: "Niébé", family: "Fabaceae", baseScore: 86, heatLimit: 4, demanding: false },
  { id: "arachide", name: "Arachide", family: "Fabaceae", baseScore: 82, heatLimit: 4, demanding: false },
  { id: "haricot", name: "Haricot", family: "Fabaceae", baseScore: 74, heatLimit: 2.5, demanding: false },
  { id: "manioc", name: "Manioc", family: "Euphorbiaceae", baseScore: 78, heatLimit: 5, demanding: false },
  { id: "patate_douce", name: "Patate douce", family: "Convolvulaceae", baseScore: 80, heatLimit: 4.5, demanding: false },
  { id: "igname", name: "Igname", family: "Dioscoreaceae", baseScore: 66, heatLimit: 3.2, demanding: true },
  { id: "tomate", name: "Tomate", family: "Solanaceae", baseScore: 60, heatLimit: 2.5, demanding: true },
  { id: "plantain", name: "Plantain", family: "Musaceae", baseScore: 64, heatLimit: 3.5, demanding: true },
  { id: "gombo", name: "Gombo", family: "Malvaceae", baseScore: 70, heatLimit: 4, demanding: false },
];

export const CROP_BY_ID: Record<string, CropInfo> = Object.fromEntries(CROPS.map((c) => [c.id, c]));

/** Pastille et fond de carte par famille (charte §2). */
export const FAMILY_STYLE: Record<Family, { dot: string; bg: string; ink: string }> = {
  Poaceae: { dot: "var(--color-poaceae)", bg: "var(--color-warn-100)", ink: "var(--color-warn-800)" },
  Fabaceae: { dot: "var(--color-fabaceae)", bg: "var(--color-leaf-100)", ink: "var(--color-forest)" },
  Euphorbiaceae: { dot: "var(--color-euphorbiaceae)", bg: "var(--color-root-100)", ink: "var(--color-root-800)" },
  Convolvulaceae: { dot: "var(--color-convolvulaceae)", bg: "var(--color-sweet-100)", ink: "var(--color-sweet-800)" },
  Dioscoreaceae: { dot: "var(--color-dioscoreaceae)", bg: "var(--color-yam-100)", ink: "var(--color-yam-800)" },
  Solanaceae: { dot: "var(--color-solanaceae)", bg: "var(--color-danger-100)", ink: "var(--color-danger-800)" },
  Musaceae: { dot: "var(--color-musaceae)", bg: "#cffafe", ink: "#155e75" },
  Malvaceae: { dot: "#65a30d", bg: "#ecfccb", ink: "#3f6212" },
};

export function cropStyle(cropId: string) {
  const crop = CROP_BY_ID[cropId];
  return FAMILY_STYLE[crop?.family ?? "Poaceae"];
}

export const SEASON_LABELS = ["2027-S1", "2027-S2", "2028-S1", "2028-S2", "2029-S1", "2029-S2"];
