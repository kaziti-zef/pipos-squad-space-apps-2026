/**
 * Calendrier des saisons, identique au backend :
 * - première saison à semer : backend/app/domain/contexte.py, premiere_saison() ;
 * - numérotation : agrorot-core/app/engine/temps.py (saison 1 = prochaine saison, 0 = la dernière, -1, -2…) ;
 * - mois : calendrier régional cm_yaounde (S1 semée en mars, pluies jusqu'en juin ; S2 semée en août, jusqu'en novembre).
 */
export type SeasonCode = "S1" | "S2";

export interface Season {
  year: number;
  code: SeasonCode;
  /** Libellé du backend, ex. « 2027-S1 ». */
  key: string;
}

export const SEASON_MONTHS: Record<SeasonCode, [number, number]> = { S1: [3, 6], S2: [8, 11] };

/** Prochaine saison à semer : avant mars -> S1 de l'année ; avant août -> S2 ; sinon S1 de l'an prochain. */
export function firstSeason(today = new Date()): Season {
  const m = today.getMonth() + 1;
  const y = today.getFullYear();
  if (m < 3) return make(y, "S1");
  if (m < 8) return make(y, "S2");
  return make(y + 1, "S1");
}

function make(year: number, code: SeasonCode): Season {
  return { year, code, key: `${year}-${code}` };
}

/** Saison n° s : 1, 2, 3… pour le plan à venir ; 0, -1, -2 pour les trois dernières saisons (historique -1, -2, -3). */
export function seasonAt(s: number, today = new Date()): Season {
  const first = firstSeason(today);
  const k = s - 1 + (first.code === "S1" ? 0 : 1);
  const year = first.year + Math.floor(k / 2);
  return make(year, ((k % 2) + 2) % 2 === 0 ? "S1" : "S2");
}

/** « 2027-S1 » -> { year: 2027, code: "S1" } ; null si le libellé n'a pas ce format. */
export function parseSeason(label: string): Season | null {
  const m = /^(\d{4})-(S[12])$/.exec(label);
  return m ? make(Number(m[1]), m[2] as SeasonCode) : null;
}
