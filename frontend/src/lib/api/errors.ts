import type { ApiErrorBody } from "./types";

/** Erreur API normalisée (contrat §3). `code` est stable ; `message` est déjà traduit par le serveur. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorBody["error"]["details"] = {},
    public readonly requestId: string | null = null,
    public readonly retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Erreurs par champ (422) indexées par chemin, ex. { "soil.ph": "Le pH doit être compris entre 3,0 et 10,0." } */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries((this.details.fields ?? []).map((f) => [f.path, f.message]));
  }

  get isNetwork() { return this.code === "NETWORK_ERROR"; }
}

export async function toApiError(res: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> = {};
  try { body = await res.json(); } catch { /* corps vide ou non JSON */ }
  const e = body.error;
  const retry = Number(res.headers.get("Retry-After")) || e?.details?.retry_after_seconds || null;
  return new ApiError(
    res.status,
    e?.code ?? (res.status >= 500 ? "INTERNAL_ERROR" : "INVALID_REQUEST"),
    e?.message ?? res.statusText,
    e?.details ?? {},
    e?.request_id ?? res.headers.get("X-Request-ID"),
    retry,
  );
}

/** Réaction attendue par le contrat (§3.8) et le guide d'intégration (§7). */
export function reaction(e: ApiError):
  | "relogin" | "forbidden" | "reload_conflict" | "highlight_fields" | "wait" | "retry_manual" | "generic" {
  if (e.status === 401) return "relogin";                 // le BFF a déjà tenté UN renouvellement
  if (e.status === 403) return "forbidden";
  if (e.code === "VERSION_CONFLICT") return "reload_conflict";
  if (e.status === 422 && e.details.fields?.length) return "highlight_fields";
  if (e.status === 429) return "wait";
  if (e.status === 503 || e.isNetwork) return "retry_manual";
  return "generic";
}
