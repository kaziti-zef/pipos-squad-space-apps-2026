/**
 * Configuration de l'API, lue côté serveur (BFF, proxy, Server Components).
 *
 * - AGROROT_API_URL défini (ex. https://api.agrirot.cm/api/v1) : l'application parle au backend.
 * - AGROROT_API_URL absent : MODE DÉMO, les écrans affichent les données de démonstration (src/lib/mocks).
 *   Utile pour déployer le frontend sur Vercel avant que le backend soit en ligne.
 *
 * Jamais de préfixe NEXT_PUBLIC_ : l'adresse du backend ne part pas dans le navigateur.
 */
export const API_URL = (process.env.AGROROT_API_URL ?? "").trim().replace(/\/$/, "");
export const API_ENABLED = API_URL !== "";

/** Cookies httpOnly posés par le BFF (src/app/api/v1/[...path]/route.ts). */
export const ACCESS_COOKIE = "agr_at";
export const REFRESH_COOKIE = "agr_rt";
/** Ferme choisie dans le menu (non sensible, lisible par le navigateur et le serveur). */
export const FARM_COOKIE = "agr_farm";
