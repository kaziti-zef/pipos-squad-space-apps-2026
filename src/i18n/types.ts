import type fr from "./dictionaries/fr.json";

/** Le dictionnaire français fait référence : en.json doit avoir exactement les mêmes clés (npm run i18n:check). */
export type Dictionary = typeof fr;
