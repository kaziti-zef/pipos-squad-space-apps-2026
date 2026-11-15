import "server-only";
/**
 * Côté SERVEUR uniquement : jetons dans des cookies httpOnly (guide §6 : jamais dans localStorage,
 * jamais dans une variable NEXT_PUBLIC_*).
 */
import { cookies } from "next/headers";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./config";
import { demanderRenouvellement, type Jetons } from "./refresh";

export type { Jetons };

export { API_ENABLED, API_URL } from "./config";

const SECURE = process.env.NODE_ENV === "production";
export const REFRESH_MAX_AGE = 60 * 60 * 24 * Number(process.env.AGROROT_REFRESH_DAYS ?? 7); // = REFRESH_TOKEN_DAYS du backend


/** Options communes des cookies de session. Chemin « / » : le proxy des pages renouvelle la session avant le rendu. */
export const COOKIE_BASE = { httpOnly: true, secure: SECURE, sameSite: "lax" as const, path: "/" };

export async function lireJetons() {
  const c = await cookies();
  return { access: c.get(ACCESS_COOKIE)?.value ?? null, refresh: c.get(REFRESH_COOKIE)?.value ?? null };
}

export async function ecrireJetons(j: Jetons) {
  const c = await cookies();
  c.set(ACCESS_COOKIE, j.access_token, { ...COOKIE_BASE, maxAge: j.expires_in });
  if (j.refresh_token) c.set(REFRESH_COOKIE, j.refresh_token, { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE });
}

export async function effacerJetons() {
  const c = await cookies();
  c.delete(ACCESS_COOKIE);
  c.delete(REFRESH_COOKIE);
}

/** Un seul renouvellement (guide §6). Renvoie le nouveau jeton d'accès ou null. */
export async function renouveler(refresh: string | null, lang: string): Promise<string | null> {
  if (!refresh) return null;
  const j = await demanderRenouvellement(refresh, lang);
  if (!j) return null;
  await ecrireJetons(j);
  return j.access_token;
}
