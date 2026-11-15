/**
 * Adaptateurs écran -> API. Ils partent des VALEURS MÉTIER, jamais du texte traduit (guide §8.4).
 */
import type { GeoPolygon, HistorySeason, PriorityKey } from "./types";

/** Points posés sur la carte ([lon, lat] ou {lat, lng}) -> Polygon GeoJSON à anneau fermé.
 *  Aire et centre affichés localement ne sont qu'un aperçu : utiliser area_ha / centroid de la réponse. */
export function pointsVersPolygone(points: ([number, number] | { lat: number; lng: number })[]): GeoPolygon {
  const coords = points.map((p) => (Array.isArray(p) ? p : [p.lng, p.lat]) as [number, number]);
  if (coords.length < 3) throw new Error("Il faut au moins 3 points pour une parcelle.");
  const [x0, y0] = coords[0];
  const [xn, yn] = coords[coords.length - 1];
  const anneau = x0 === xn && y0 === yn ? coords : [...coords, coords[0]];
  return { type: "Polygon", coordinates: [anneau] };
}

/** Formulaire Priorités : il ne fournit QUE l'ordre et les exclusions (guide §5).
 *  On n'invente ni équipement, ni main-d'œuvre, ni marchés : le serveur garde ses valeurs par défaut
 *  (et renvoie l'avertissement MARKETS_NOT_PROVIDED). */
export function prioritesVersPreferences(ordre: PriorityKey[], culturesExclues: string[]) {
  return {
    ranking: ordre,
    constraints: { excluded_crops: culturesExclues, equipment: [], labor: null, market_available_crops: [] },
  };
}

/** Écran Terrain, historique : trois sélecteurs de la plus ancienne à la plus récente.
 *  null = saison inconnue (omise) ; "jachere" = saison de repos. */
export function historiqueVersApi(cultures: [string | null, string | null, string | null], libelles?: string[]) {
  const seasons: HistorySeason[] = [];
  cultures.forEach((crop, i) => {
    if (crop) seasons.push({ season_index: (i - 3) as -3 | -2 | -1, crop_id: crop, label: libelles?.[i] ?? null });
  });
  return { seasons };
}

/** Écran Stratégies : modifications manuelles -> manual_overrides ({ recommended: { "2": "niebe" } }). */
export function substitutionsVersOverrides(subs: { strategy: "existing" | "recommended" | "alternative"; season: number; cropId: string }[]) {
  const out: Record<string, Record<string, string>> = {};
  for (const s of subs) (out[s.strategy] ??= {})[String(s.season)] = s.cropId;
  return out;
}

/** Libellés des six critères (ajout au contrat : strategy.scores). */
export const CRITERES: Record<"S1" | "S2" | "S3" | "S4" | "S5" | "S6", { fr: string; en: string }> = {
  S1: { fr: "Climat", en: "Climate" },
  S2: { fr: "Eau", en: "Water" },
  S3: { fr: "Fertilité du sol", en: "Soil fertility" },
  S4: { fr: "Érosion", en: "Erosion" },
  S5: { fr: "Maladies et ravageurs", en: "Pests and diseases" },
  S6: { fr: "Vos priorités", en: "Your priorities" },
};
