/**
 * Client NAVIGATEUR : appelle le BFF Next (/api/v1/... sur la même origine). Il ne voit JAMAIS les jetons :
 * le BFF les garde dans des cookies httpOnly et ajoute l'en-tête Authorization côté serveur.
 */
import { ApiError, toApiError } from "./errors";
import type { Lang } from "./types";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  /** Version courante de la ressource (contrat §1) -> en-tête If-Match. */
  ifMatch?: number;
  lang?: Lang;
  signal?: AbortSignal;
}

const BASE = "/api/v1";
const ATTENTES_LECTURE_503 = [1000, 3000]; // contrat §3.8 : 2 réessais max, lectures uniquement

function langueCourante(): Lang {
  if (typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=(fr|en)/);
    if (m) return m[1] as Lang;
    if (location.pathname.startsWith("/en")) return "en";
  }
  return "fr";
}

function url(path: string, query?: RequestOptions["query"]) {
  const u = new URL(BASE + path, typeof window === "undefined" ? "http://localhost" : window.location.origin);
  Object.entries(query ?? {}).forEach(([k, v]) => { if (v !== undefined && v !== null) u.searchParams.set(k, String(v)); });
  return u.pathname + u.search;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {
    "Accept-Language": opts.lang ?? langueCourante(),
    "X-Request-ID": `req_${crypto.randomUUID().slice(0, 8)}`,
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.ifMatch !== undefined) headers["If-Match"] = String(opts.ifMatch);

  const essais = method === "GET" ? ATTENTES_LECTURE_503.length + 1 : 1;
  for (let i = 0; i < essais; i++) {
    let res: Response;
    try {
      res = await fetch(url(path, opts.query), {
        method, headers, signal: opts.signal, credentials: "same-origin",
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      });
    } catch {
      throw new ApiError(0, "NETWORK_ERROR", "Connexion impossible.");
    }
    if (res.ok) {
      if (res.status === 204) return undefined as T;
      const type = res.headers.get("content-type") ?? "";
      return (type.includes("application/json") ? await res.json() : await res.blob()) as T;
    }
    if (res.status === 503 && i < essais - 1) {
      await new Promise((r) => setTimeout(r, ATTENTES_LECTURE_503[i]));
      continue;
    }
    throw await toApiError(res);
  }
  throw new ApiError(503, "CLIMATE_DATA_UNAVAILABLE", "Service momentanément indisponible.");
}

/** Parcourt une liste paginée jusqu'à next_cursor = null. */
export async function toutesLesPages<T, K extends string>(
  path: string, cle: K, limit = 50,
): Promise<T[]> {
  const out: T[] = [];
  let cursor: string | null = null;
  do {
    const page: Record<K, T[]> & { next_cursor: string | null } =
      await api(path, { query: { limit, cursor: cursor ?? undefined } });
    out.push(...page[cle]);
    cursor = page.next_cursor;
  } while (cursor);
  return out;
}
