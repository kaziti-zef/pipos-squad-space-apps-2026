/**
 * Renouvellement de session sans dépendre de next/headers : utilisable par le BFF et par le proxy des pages.
 */
import { API_URL } from "./config";

export interface Jetons { access_token: string; refresh_token?: string; expires_in: number }

export async function demanderRenouvellement(refresh: string, lang: string): Promise<Jetons | null> {
  try {
    const r = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/json", "Accept-Language": lang },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    return r.ok ? ((await r.json()) as Jetons) : null;
  } catch {
    return null;
  }
}
