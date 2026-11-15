/**
 * Types du contrat d'API REST AgriRot v2.0 (14/11/2026).
 * Ne pas modifier sans mettre à jour le contrat avec l'équipe backend.
 */

export type Role = "owner" | "co_farmer" | "advisor";
export type MemberStatus = "active" | "pending";
export type StrategyType = "existing" | "recommended" | "alternative";
export type ConfidenceLevel = "élevée" | "moyenne" | "faible";
export type DataSourceStatus = "live" | "fallback_cache" | "fallback_local";
export type PriorityKey =
  | "water_saving"
  | "income"
  | "soil_health"
  | "nitrogen"
  | "erosion_control"
  | "fodder";
export type NoteKind = "observation" | "validation";
export type MonthQuality = "ok" | "interpolated" | "unavailable";
export type WaterNeed = "faible" | "moyen" | "élevé";
export type ClimateAlert =
  | "dry_season"
  | "bare_soil_risk"
  | "water_stress"
  | "heavy_rain"
  | "heat_stress"
  | "frost_risk";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
    request_id: string;
  };
}

export interface Warning {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface User {
  id: string;
  full_name: string;
  identifier: string;
  language?: "fr" | "en";
}

export interface Farm {
  id: string;
  name: string;
  region: string;
  user_role: Role;
  parcels_count: number;
  members_count: number;
  version?: number;
}

export interface Member {
  member_id: string;
  full_name: string | null;
  identifier: string;
  role: Role;
  status: MemberStatus;
  invitation_expires_at?: string;
}

export interface Crop {
  id: string;
  name: string;
  botanical_family: string;
  cycle_days: number;
  nitrogen_fixing: boolean;
  water_need: WaterNeed;
}

export interface GeoPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface Parcel {
  id: string;
  farm_id: string;
  name: string;
  area_ha: number;
  centroid: { lat: number; lon: number };
  srtm?: { elevation_m: number; slope_deg: number };
  geometry: GeoPolygon;
  data_completeness: { local_inputs: boolean; history: boolean; preferences: boolean };
  last_saved_strategy?: {
    saved_id: string;
    type: StrategyType;
    score: number;
    saved_at: string;
  } | null;
  version?: number;
}

export interface MonthlyClimate {
  month: number;
  label: string;
  temp_avg_c: number;
  temp_normal_c: number;
  rain_mm: number;
  rain_normal_mm: number;
  soil_moisture_anomaly: number;
  ndvi: number;
  evapotranspiration_mm: number;
  water_balance_mm: number;
  frost_risk: number;
  quality: MonthQuality;
  alerts: ClimateAlert[];
}

export interface ClimateResponse {
  parcel_id: string;
  data_source_status: DataSourceStatus;
  cached_at: string | null;
  grid_resolution_note: string;
  monthly_series: MonthlyClimate[];
  vulnerable_periods: { type: "water_stress" | "bare_soil"; from_month: number; to_month: number }[];
  missing_indicators: string[];
  glossary: Record<string, string>;
}

export interface SeasonEntry {
  season: number;
  label: string;
  crop_id: string;
  crop_name: string;
  season_score: number;
  modified_by_user: boolean;
}

export interface StrategyExplanation {
  why: string[];
  proofs: string[];
  benefits: string[];
  information_gaps: string[];
  local_risks_to_check: string[];
}

export interface Strategy {
  id: StrategyType;
  type: StrategyType;
  name: string;
  score: number;
  resilience_index: number;
  confidence: { score: number; level: ConfidenceLevel };
  sequence: SeasonEntry[];
  explanation: StrategyExplanation;
  non_viable?: boolean;
}

export interface ClimateScenario {
  rain_delta_pct: number;
  temp_delta_c: number;
  horizon_years: 0 | 5 | 10;
}

export interface StrategiesResponse {
  parcel_id: string;
  computation_id: string;
  computed_at: string;
  data_source_status: DataSourceStatus;
  disclaimer: string;
  applied_scenario: ClimateScenario;
  warnings: Warning[];
  strategies: Strategy[];
}

export interface Note {
  note_id: string;
  kind: NoteKind;
  text: string;
  author: { id: string; full_name: string; role: Role };
  created_at: string;
}
