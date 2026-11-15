/**
 * Types des RÉPONSES de l'API AgroRot (contrat v2 + ajouts du backend).
 * Les corps de REQUÊTE sont générés depuis l'OpenAPI dans `schema.gen.ts` (npx openapi-typescript).
 * Les champs `null` sont réels : ne pas les typer en `number` seul (guide d'intégration, §8.5).
 */

export type Lang = "fr" | "en";
export type Role = "owner" | "co_farmer" | "advisor";
export type StrategyId = "existing" | "recommended" | "alternative";
export type ConfidenceLevel = "élevée" | "moyenne" | "faible";
export type DataSourceStatus = "live" | "fallback_cache" | "fallback_local";
export type PriorityKey = "water_saving" | "income" | "soil_health" | "nitrogen" | "erosion_control" | "fodder";

export interface Warning { code: string; message: string; details?: Record<string, unknown> }

// ---------------------------------------------------------------- erreurs (§3)
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: {
      fields?: { path: string; reason: string; message: string; [k: string]: unknown }[];
      retry_after_seconds?: number;
      current_version?: number;
      your_version?: number;
      [k: string]: unknown;
    };
    request_id: string;
  };
}

// ---------------------------------------------------------------- auth (§4)
export interface UserLite { id: string; full_name: string; identifier: string }
export interface Me extends UserLite { language: Lang }
/** Ce que le BFF renvoie au navigateur après login/register : PAS de jetons. */
export interface SessionResponse { user: UserLite; expires_in: number }

// ---------------------------------------------------------------- référentiel (§5)
export interface Region { code: string; name: string; country: string; crops_file: string }
export interface Crop {
  id: string; name: string; botanical_family: string; cycle_days: number | null;
  nitrogen_fixing: boolean; water_need: "faible" | "moyen" | "élevé";
}

// ---------------------------------------------------------------- fermes, membres (§6)
export interface Farm {
  id: string; name: string; region: string; user_role: Role;
  parcels_count: number; members_count: number; version?: number;
}
export interface MemberItem {
  member_id: string; full_name: string | null; identifier: string; role: Role;
  status: "active" | "pending"; invitation_expires_at?: string;
}
export interface MemberCreated extends MemberItem {
  farm_id: string; invitation?: { link: string; expires_at: string };
}

// ---------------------------------------------------------------- parcelles (§7)
export interface GeoPolygon { type: "Polygon"; coordinates: number[][][] } // [lon, lat]
export interface DataCompleteness { local_inputs: boolean; history: boolean; preferences: boolean }
export interface Parcel {
  id: string; farm_id: string; name: string; area_ha: number;
  centroid: { lat: number; lon: number };
  srtm: { elevation_m: number | null; slope_deg: number | null };
  geometry: GeoPolygon; data_completeness: DataCompleteness; version: number; warnings: Warning[];
}
export interface ParcelListItem {
  id: string; name: string; area_ha: number; centroid: { lat: number; lon: number }; geometry: GeoPolygon;
  data_completeness: DataCompleteness;
  last_saved_strategy: { saved_id: string; type: StrategyId; score: number; saved_at: string } | null;
}
export interface ParcelList { parcels: ParcelListItem[]; next_cursor: string | null }

// ---------------------------------------------------------------- diagnostic (§8)
export type ClimateAlert = "dry_season" | "bare_soil_risk" | "water_stress" | "heavy_rain" | "heat_stress" | "frost_risk";
export interface ClimateMonth {
  month: number; label: string;
  temp_avg_c: number | null; temp_normal_c: number | null;
  rain_mm: number | null; rain_normal_mm: number | null;
  soil_moisture_anomaly: number | null; ndvi: number | null;
  evapotranspiration_mm: number | null; water_balance_mm: number | null;
  frost_risk: number; quality: "ok" | "interpolated" | "unavailable"; alerts: ClimateAlert[];
  corrected_by_user?: boolean;               // ajout
}
export interface ClimateResponse {
  parcel_id: string; year?: number; synthetique?: boolean;
  data_source_status: DataSourceStatus; cached_at: string | null; grid_resolution_note: string;
  monthly_series: ClimateMonth[];
  vulnerable_periods: { type: "water_stress" | "bare_soil" | "heavy_rain"; from_month: number; to_month: number }[];
  missing_indicators: string[]; glossary: Record<string, string>;
}

// ---------------------------------------------------------------- saisies (§9)
export interface Soil {
  texture: "sableux" | "limoneux" | "argileux" | "argilo-limoneux" | "sablo-limoneux" | null;
  ph: number | null; drainage: "faible" | "moyen" | "bon" | null;
  organic_matter: "faible" | "moyenne" | "élevée" | null; slope_deg: number | null; slope_confirmed: boolean;
}
export interface LocalInputs {
  parcel_id: string; soil: Soil;
  water: { has_irrigation: boolean; dry_season_availability: "nulle" | "faible" | "moyenne" | "bonne" };
  nasa_overrides: { field: "rain_mm" | "temp_avg_c"; month: number; mode: "adjustment"; value: number }[];
  practices: { fertilizer_use: "aucun" | "organique" | "mineral" | "mixte" | null; residue_return: number | null }; // ajout
  pest_history: string[];                                                                                      // ajout
  planned_rotation: { season: number; crop_id: string }[];                                                     // ajout
  input_confidence: Record<string, number>;
  parcel_confidence: { score: number; level: ConfidenceLevel };
  defaults_used: string[]; version: number;
}
export interface HistorySeason { season_index: -3 | -2 | -1; label?: string | null; crop_id: string; botanical_family?: string | null }
export interface History { parcel_id: string; seasons: HistorySeason[]; version: number }
export interface Constraints {
  equipment: string[]; labor: "familiale" | "salariée" | "mixte" | null;
  excluded_crops: string[]; market_available_crops: string[];
}
export interface Preferences {
  weights: Record<PriorityKey, number>; source: "ranking" | "weights" | "default";
  constraints: Constraints; warnings: Warning[]; version: number;
}

// ---------------------------------------------------------------- stratégies (§10)
export interface SequenceStep {
  season: number; label: string; crop_id: string; crop_name: string; season_score: number; modified_by_user: boolean;
  sowing_month: number | null; harvest_month: number | null; continuation: boolean;   // ajouts
}
export interface Explanation {
  why: string[]; proofs: string[]; benefits: string[]; information_gaps: string[]; local_risks_to_check: string[];
}
export type CriterionKey = "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
export interface Violation { code: string; message: string; season: number | null; crop_id: string | null; details: Record<string, unknown> }
export interface Strategy {
  id: StrategyId; type: StrategyId; name: string;
  score: number;                         // 0-100
  resilience_index: number;              // 0-1, jamais affiché comme un score
  confidence: { score: number; level: ConfidenceLevel };   // 0-1
  sequence: SequenceStep[]; explanation: Explanation; non_viable: boolean;
  scores: Record<CriterionKey, number>;                     // ajout : S1 Climat … S6 Priorités
  delta_vs_existing: Partial<Record<CriterionKey, number>>; // ajout
  violations: Violation[];                                  // ajout
  off_rotation_advice: string[];                            // ajout
}
export interface ClimateScenario { rain_delta_pct: number; temp_delta_c: number; horizon_years: 0 | 5 | 10 }
export interface StrategiesResponse {
  parcel_id: string; computation_id: string; computed_at: string;
  data_source_status: DataSourceStatus; cached_at: string | null; disclaimer: string;
  applied_scenario: ClimateScenario; warnings: Warning[]; strategies: [Strategy, Strategy, Strategy];
}

// ---------------------------------------------------------------- sauvegarde (§11)
export interface SaveResponse {
  saved_id: string; parcel_id: string; strategy_id: StrategyId; saved_at: string;
  saved_by: { id: string; full_name: string; role: Role }; pdf_export_url: string;
  monitoring_active: boolean;                               // ajout T65
}
export interface SavedListItem {
  saved_id: string; strategy_id: StrategyId; name: string; score: number; saved_at: string; saved_by: string;
  notes_count: number; outdated_geometry: boolean;
}
export interface SavedList { saved: SavedListItem[]; next_cursor: string | null }
export interface Note {
  note_id: string; kind: "observation" | "validation"; text: string;
  author: { id: string; full_name: string; role: Role }; created_at: string;
}
export interface SavedDetail extends Strategy {
  saved_id: string; parcel_id: string; saved_at: string; saved_by: string; computation_id: string; computed_at: string;
  applied_scenario: ClimateScenario; manual_overrides: Record<string, Record<string, string>>;
  data_source_status: DataSourceStatus; disclaimer: string; outdated_geometry: boolean; notes: Note[];
}

// ---------------------------------------------------------------- santé (§12)
export interface Health {
  status: "ok" | "degraded";
  components: { database: string; engine: string; nasa_power: string; cache: string };
  time: string;
}

// ---------------------------------------------------------------- surveillance et notifications (ajout T65)
export type Severity = "info" | "warning" | "critical";
export type AlertCode = "SOWING_FAVORABLE" | "SOWING_DELAY" | "WATER_STRESS" | "HEAVY_RAIN" | "HEAT_STRESS"
  | "SEASON_ANOMALY" | "ROTATION_MISMATCH";
export interface MonitoredStep {
  season: number; label: string; crop_id: string; crop_name: string; sowing_date: string; harvest_date: string;
}
export interface MonitoringAlert {
  code: AlertCode; severity: Severity; title: string; message: string; advice: string[];
  data: Record<string, unknown> & { suggested_scenario?: ClimateScenario };
}
export interface MonitoringState {
  checked_at: string; reference_date: string; simulated_date: boolean;
  weather: {
    source: string | null; status: "live" | "simulated" | "unavailable"; generated_at?: string;
    rain_last_30d_mm?: number; rain_normal_30d_mm?: number | null; rain_ratio_30d?: number | null;
    rain_last_10d_mm?: number; rain_next_7d_mm?: number;
    max_daily_rain_mm?: number | null; max_daily_rain_date?: string | null; tmax_anomaly_30d_c?: number | null;
  };
  position: {
    phase: "not_started" | "sowing_window" | "in_crop" | "between_crops" | "finished";
    current: MonitoredStep | null; growth_fraction: number | null; sowing: MonitoredStep | null; next: MonitoredStep | null;
  };
  alerts: MonitoringAlert[];
  evaluation: null | {
    scenario: ClimateScenario; score_normal: number; score_if_season_continues: number; drop: number;
    target_season: number | null; target_season_score: number | null;
  };
}
export interface Monitoring { saved_id: string | null; active: boolean; strategy_name: string | null; state: MonitoringState | null }
export interface AppNotification {
  id: string; code: AlertCode; severity: Severity; title: string; message: string;
  farm_id: string; parcel_id: string; saved_id: string | null; created_at: string; read: boolean;
  data: Record<string, unknown> & { advice?: string[]; parcel_name?: string; simulated_date?: boolean };
}
export interface NotificationList { notifications: AppNotification[]; next_cursor: string | null; unread_count: number }
