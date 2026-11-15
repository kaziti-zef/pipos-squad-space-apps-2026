/** Une fonction par route du contrat v2 (+ ajouts). Les corps de requête viennent de schema.gen.ts. */
import { api, toutesLesPages } from "./client";
import type { components } from "./schema.gen";
import type {
  AppNotification, ClimateResponse, ClimateScenario, Crop, Farm, GeoPolygon, Health, History, LocalInputs, Me, MemberCreated,
  MemberItem, Monitoring, Note, NotificationList, Parcel, ParcelList, ParcelListItem, Preferences, PriorityKey, Region, SaveResponse, SavedDetail,
  SavedList, SessionResponse, StrategiesResponse, StrategyId,
} from "./types";

type S = components["schemas"];

// ---------------------------------------------------------------- auth (via le BFF : jetons en cookies httpOnly)
export const auth = {
  register: (b: S["Inscription"]) => api<SessionResponse>("/auth/register", { method: "POST", body: b }),
  login: (b: S["Connexion"]) => api<SessionResponse>("/auth/login", { method: "POST", body: b }),
  logout: () => api<void>("/auth/logout", { method: "POST", body: {} }),
  me: () => api<Me>("/auth/me"),
  forgotPassword: (identifier: string) => api<void>("/auth/forgot-password", { method: "POST", body: { identifier } }),
  resetPassword: (token: string, new_password: string) =>
    api<void>("/auth/reset-password", { method: "POST", body: { token, new_password } }),
};

// ---------------------------------------------------------------- référentiel
export const referentiel = {
  regions: () => api<{ regions: Region[] }>("/regions"),
  crops: (region: string) => api<{ region: string; crops: Crop[] }>("/crops", { query: { region } }),
};

// ---------------------------------------------------------------- fermes et membres
export const farms = {
  list: () => api<{ farms: Farm[] }>("/farms"),
  get: (id: string) => api<Farm>(`/farms/${id}`),
  create: (name: string, region: string) => api<Farm>("/farms", { method: "POST", body: { name, region } }),
  update: (id: string, b: S["ModifFerme"], version: number) =>
    api<Farm>(`/farms/${id}`, { method: "PATCH", body: b, ifMatch: version }),
  remove: (id: string, confirm_name: string) => api<void>(`/farms/${id}`, { method: "DELETE", body: { confirm_name } }),
  transfer: (id: string, member_id: string) =>
    api<Farm>(`/farms/${id}/transfer-ownership`, { method: "POST", body: { member_id } }),
  members: (id: string) => api<{ members: MemberItem[] }>(`/farms/${id}/members`),
  addMember: (id: string, identifier: string, role: "co_farmer" | "advisor") =>
    api<MemberCreated>(`/farms/${id}/members`, { method: "POST", body: { identifier, role } }),
  updateMember: (id: string, memberId: string, b: S["Modif"]) =>
    api<MemberItem>(`/farms/${id}/members/${memberId}`, { method: "PATCH", body: b }),
  removeMember: (id: string, memberId: string | "me") =>
    api<void>(`/farms/${id}/members/${memberId}`, { method: "DELETE" }),
};

// ---------------------------------------------------------------- parcelles
export const parcels = {
  listAll: (farmId: string) => toutesLesPages<ParcelListItem, "parcels">(`/farms/${farmId}/parcels`, "parcels"),
  page: (farmId: string, cursor?: string) => api<ParcelList>(`/farms/${farmId}/parcels`, { query: { cursor } }),
  get: (id: string) => api<Parcel>(`/parcels/${id}`),
  create: (farm_id: string, name: string, geometry: GeoPolygon) =>
    api<Parcel>("/parcels", { method: "POST", body: { farm_id, name, geometry } }),
  update: (id: string, b: { name?: string; geometry?: GeoPolygon }, version: number) =>
    api<Parcel>(`/parcels/${id}`, { method: "PATCH", body: b, ifMatch: version }),
  remove: (id: string) => api<void>(`/parcels/${id}`, { method: "DELETE" }),
  climate: (id: string, year?: number) => api<ClimateResponse>(`/parcels/${id}/climate`, { query: { year } }),
};

// ---------------------------------------------------------------- saisies
export const inputs = {
  getLocal: (id: string) => api<LocalInputs>(`/parcels/${id}/local-inputs`),
  putLocal: (id: string, b: S["DonneesLocales"], version: number) =>
    api<LocalInputs>(`/parcels/${id}/local-inputs`, { method: "PUT", body: b, ifMatch: version }),
  getHistory: (id: string) => api<History>(`/parcels/${id}/history`),
  putHistory: (id: string, b: S["Historique"], version: number) =>
    api<History>(`/parcels/${id}/history`, { method: "PUT", body: b, ifMatch: version }),
  getPreferences: (id: string) => api<Preferences>(`/parcels/${id}/preferences`),
  putPreferences: (id: string, b: S["Preferences"], version: number) =>
    api<Preferences>(`/parcels/${id}/preferences`, { method: "PUT", body: b, ifMatch: version }),
};

// ---------------------------------------------------------------- stratégies
export interface ComputeOptions {
  horizon_seasons?: number;
  priorities?: Partial<Record<PriorityKey, number>> | null;
  constraints?: Record<string, unknown> | null;
  climate_scenario?: ClimateScenario;
  /** { recommended: { "2": "niebe" } } : saison (1..n) -> crop_id */
  manual_overrides?: Partial<Record<StrategyId, Record<string, string>>>;
}

export const strategies = {
  compute: (parcelId: string, o: ComputeOptions = {}) =>
    api<StrategiesResponse>(`/parcels/${parcelId}/strategies`, { method: "POST", body: o }),
  /** AJOUT : relit un calcul non sauvegardé (24 h) pour la page de détail, sans relancer le moteur. */
  computed: (parcelId: string, computationId: string) =>
    api<StrategiesResponse>(`/parcels/${parcelId}/strategies/computed/${computationId}`),
  /** monitor (défaut true) : la rotation sauvegardée devient la rotation surveillée de la parcelle. */
  save: (parcelId: string, computation_id: string, strategy_id: StrategyId, note?: string, monitor = true) =>
    api<SaveResponse>(`/parcels/${parcelId}/strategies/save`, { method: "POST", body: { computation_id, strategy_id, note, monitor } }),
  saved: (parcelId: string, cursor?: string) =>
    api<SavedList>(`/parcels/${parcelId}/strategies/saved`, { query: { cursor } }),
  savedDetail: (parcelId: string, savedId: string) =>
    api<SavedDetail>(`/parcels/${parcelId}/strategies/saved/${savedId}`),
  addNote: (parcelId: string, savedId: string, kind: "observation" | "validation", text: string) =>
    api<Note>(`/parcels/${parcelId}/strategies/saved/${savedId}/notes`, { method: "POST", body: { kind, text } }),
  removeNote: (parcelId: string, savedId: string, noteId: string) =>
    api<void>(`/parcels/${parcelId}/strategies/saved/${savedId}/notes/${noteId}`, { method: "DELETE" }),
  /** URL du PDF à ouvrir dans un nouvel onglet ; en cas d'échec (503 PDF_GENERATION_FAILED) : window.print(). */
  pdfUrl: (parcelId: string, savedId: string) => `/api/v1/parcels/${parcelId}/strategies/saved/${savedId}/export.pdf`,
};

// ---------------------------------------------------------------- surveillance (ajout T65)
export const monitoring = {
  get: (parcelId: string) => api<Monitoring>(`/parcels/${parcelId}/monitoring`),
  /** Vérifie maintenant ; `date` (AAAA-MM-JJ) simule un autre jour pour la démo. */
  run: (parcelId: string, date?: string) =>
    api<Monitoring>(`/parcels/${parcelId}/monitoring/run`, { method: "POST", query: { date } }),
  setActive: (parcelId: string, savedId: string, active: boolean) =>
    api<Monitoring>(`/parcels/${parcelId}/strategies/saved/${savedId}/monitoring`, { method: "PUT", body: { active } }),
};

// ---------------------------------------------------------------- notifications (ajout T65)
export const notifications = {
  list: (o: { unreadOnly?: boolean; cursor?: string; limit?: number; severity?: AppNotification["severity"] } = {}) =>
    api<NotificationList>("/notifications", { query: { unread_only: o.unreadOnly ? "true" : undefined, cursor: o.cursor, limit: o.limit, severity: o.severity } }),
  unreadCount: () => api<{ unread_count: number }>("/notifications/unread-count"),
  markRead: (id: string) => api<void>(`/notifications/${id}/read`, { method: "POST", body: {} }),
  markAllRead: () => api<void>("/notifications/read-all", { method: "POST", body: {} }),
};

export const health = () => api<Health>("/health");
