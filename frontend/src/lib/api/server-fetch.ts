import "server-only";
/** Lecture depuis un Server Component (ex. page de détail) : même jeton httpOnly, sans passer par le BFF. */
import { headers } from "next/headers";
import { ApiError, toApiError } from "./errors";
import { API_URL, lireJetons } from "./session.server";

export async function apiServeur<T>(path: string, lang?: "fr" | "en"): Promise<T> {
  const { access } = await lireJetons();
  const h = await headers();
  // Délai maximal : une page ne doit pas rester bloquée si le backend ne répond pas (voir le BFF).
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(Number(process.env.AGROROT_API_TIMEOUT_MS) || 45_000),
    headers: {
      "Accept-Language": lang ?? h.get("accept-language") ?? "fr",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}
export { ApiError };
