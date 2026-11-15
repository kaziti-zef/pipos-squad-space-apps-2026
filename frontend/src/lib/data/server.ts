import "server-only";
/**
 * Lecture des données pour les Server Components.
 *
 * - Backend configuré (AGROROT_API_URL) : appels réels avec le jeton httpOnly (le proxy l'a renouvelé si besoin).
 * - Sinon : données de démonstration (src/lib/mocks), pour que le site reste montrable sur Vercel.
 *
 * Les erreurs courantes sont traduites en navigation : 401 -> connexion, 403/404 -> page introuvable.
 */
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Locale as Lang } from "@/i18n/config";
import { ApiError } from "@/lib/api/errors";
import { API_ENABLED, FARM_COOKIE } from "@/lib/api/config";
import { apiServeur } from "@/lib/api/server-fetch";
import type * as Api from "@/lib/api/types";
import { currentUser, farms as demoFarms, parcels as demoParcels } from "@/lib/mocks";
import { getClimate, getParcels, getStrategies } from "@/lib/mocks/localized";

export { API_ENABLED };

async function get<T>(path: string, lang: Lang): Promise<T> {
  try {
    return await apiServeur<T>(path, lang);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) redirect(`/${lang}/connexion`);
      if (e.status === 403 || e.status === 404) notFound();
    }
    throw e;
  }
}

/** Comme get(), mais renvoie null sur 404 (ressource facultative, ex. calcul périmé). */
async function getOrNull<T>(path: string, lang: Lang): Promise<T | null> {
  try {
    return await apiServeur<T>(path, lang);
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) redirect(`/${lang}/connexion`);
      if (e.status === 404) return null;
      if (e.status === 403) notFound();
    }
    throw e;
  }
}

// ------------------------------------------------------------------ session et ferme courante

export interface AppSession {
  user: { id: string; full_name: string };
  farms: Api.Farm[];
  farm: Api.Farm | null;
}

/** Utilisateur, fermes et ferme choisie (cookie agr_farm, sinon la première). */
export async function loadSession(lang: Lang): Promise<AppSession> {
  if (!API_ENABLED) {
    const farms = demoFarms.map((f) => ({ ...f, user_role: "owner" as const })) as unknown as Api.Farm[];
    return { user: { id: currentUser.id, full_name: currentUser.full_name }, farms, farm: farms[0] };
  }
  const [me, list] = await Promise.all([get<Api.Me>("/auth/me", lang), get<{ farms: Api.Farm[] }>("/farms", lang)]);
  const chosen = (await cookies()).get(FARM_COOKIE)?.value;
  const farm = list.farms.find((f) => f.id === chosen) ?? list.farms[0] ?? null;
  return { user: me, farms: list.farms, farm };
}

// ------------------------------------------------------------------ parcelles

/** Parcelle telle qu'affichée au tableau de bord (les champs current_crop / note n'existent qu'en démo). */
export type DashboardParcel = Api.ParcelListItem & { current_crop?: string; note?: string };

export async function loadParcels(lang: Lang, farmId: string | null): Promise<DashboardParcel[]> {
  if (!API_ENABLED) return getParcels(lang) as unknown as DashboardParcel[];
  if (!farmId) return [];
  const out: DashboardParcel[] = [];
  let cursor: string | null = null;
  do {
    const q: string = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=50` : "?limit=50";
    const page: Api.ParcelList = await get<Api.ParcelList>(`/farms/${farmId}/parcels${q}`, lang);
    out.push(...page.parcels);
    cursor = page.next_cursor;
  } while (cursor);
  return out;
}

export async function loadParcel(id: string, lang: Lang): Promise<Api.Parcel> {
  if (!API_ENABLED) {
    const p = demoParcels.find((x) => x.id === id) ?? demoParcels[0];
    return { ...p, srtm: p.srtm ?? { elevation_m: null, slope_deg: null }, version: 1, warnings: [] } as unknown as Api.Parcel;
  }
  return get<Api.Parcel>(`/parcels/${id}`, lang);
}

// ------------------------------------------------------------------ diagnostic et saisies

export async function loadClimate(id: string, lang: Lang): Promise<Api.ClimateResponse> {
  if (!API_ENABLED) return getClimate(lang) as unknown as Api.ClimateResponse;
  return get<Api.ClimateResponse>(`/parcels/${id}/climate`, lang);
}

export interface ParcelInputs {
  local: Api.LocalInputs | null;
  history: Api.History | null;
  preferences: Api.Preferences | null;
}

export async function loadInputs(id: string, lang: Lang): Promise<ParcelInputs> {
  if (!API_ENABLED) return { local: null, history: null, preferences: null };
  const [local, history, preferences] = await Promise.all([
    get<Api.LocalInputs>(`/parcels/${id}/local-inputs`, lang),
    get<Api.History>(`/parcels/${id}/history`, lang),
    get<Api.Preferences>(`/parcels/${id}/preferences`, lang),
  ]);
  return { local, history, preferences };
}

// ------------------------------------------------------------------ stratégies

/** Démo : jeu fixe. API : le calcul est lancé côté navigateur (POST), voir StrategiesLoader. */
export function demoStrategies(lang: Lang) {
  return getStrategies(lang) as unknown as Api.StrategiesResponse;
}

/** Détail : relit un calcul mémorisé 24 h (?c=computation_id), null s'il a expiré. */
export async function loadComputation(parcelId: string, computationId: string, lang: Lang) {
  return getOrNull<Api.StrategiesResponse>(`/parcels/${parcelId}/strategies/computed/${computationId}`, lang);
}

export async function loadSavedList(parcelId: string, lang: Lang): Promise<Api.SavedDetail[]> {
  const list = await get<Api.SavedList>(`/parcels/${parcelId}/strategies/saved`, lang);
  // Le détail porte la séquence et les notes : la liste d'une parcelle reste courte.
  return Promise.all(list.saved.map((s) => get<Api.SavedDetail>(`/parcels/${parcelId}/strategies/saved/${s.saved_id}`, lang)));
}

export async function loadMembers(farmId: string, lang: Lang) {
  return get<{ members: Api.MemberItem[] }>(`/farms/${farmId}/members`, lang);
}

/** Rôle de la personne connectée sur la ferme de cette parcelle (conseiller = lecture seule). */
export async function loadRole(parcelId: string, lang: Lang): Promise<Api.Role> {
  if (!API_ENABLED) return "owner";
  const [parcel, list] = await Promise.all([loadParcel(parcelId, lang), get<{ farms: Api.Farm[] }>("/farms", lang)]);
  return list.farms.find((f) => f.id === parcel.farm_id)?.user_role ?? "advisor";
}
