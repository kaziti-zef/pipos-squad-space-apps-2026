"use client";

import { useI18n } from "@/i18n/client";
import { parseSeason, SEASON_MONTHS, type Season } from "@/lib/domain/seasons";

/** Libellés lisibles d'une saison : « S1 2027 » et « mars → juin ». */
export function useSeasonText() {
  const { t, lang } = useI18n();
  const month = (m: number) => (lang === "fr" ? t.months[m - 1].toLocaleLowerCase("fr") : t.months[m - 1]);
  const text = (s: Season) => {
    const [a, b] = SEASON_MONTHS[s.code];
    return { title: `${s.code} ${s.year}`, months: `${month(a)} → ${month(b)}` };
  };
  /** Libellé du backend (« 2027-S1 ») ; renvoyé tel quel s'il n'a pas ce format. */
  const fromKey = (key: string) => {
    const s = parseSeason(key);
    return s ? text(s) : { title: key, months: "" };
  };
  return { text, fromKey };
}
