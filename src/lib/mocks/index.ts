/**
 * Fausses données reprises des exemples du contrat d'API v2.
 * Elles permettent d'avancer le frontend avant le branchement de l'API (phase 3).
 */
import type {
  ClimateResponse,
  Farm,
  Member,
  Parcel,
  StrategiesResponse,
  User,
} from "@/lib/types";
import { CROP_BY_ID, SEASON_LABELS } from "@/lib/domain/crops";

export const DEMO_PARCEL_ID = "pcl_55";

export const currentUser: User = {
  id: "usr_01",
  full_name: "Jean Mbarga",
  identifier: "jean.mbarga@exemple.cm",
  language: "fr",
};

export const farms: Farm[] = [
  { id: "frm_101", name: "Ferme de Mbankomo", region: "cm_yaounde", user_role: "owner", parcels_count: 3, members_count: 3, version: 1 },
  { id: "frm_102", name: "Ferme Nkolbisson", region: "cm_yaounde", user_role: "advisor", parcels_count: 1, members_count: 2, version: 1 },
];

export const members: (Member & { added_at: string; initials: string })[] = [
  { member_id: "mbr_01", full_name: "Jean Mbarga", identifier: "jean.mbarga@exemple.cm", role: "owner", status: "active", added_at: "01/03/2026", initials: "JM" },
  { member_id: "mbr_02", full_name: "Paul Essomba", identifier: "+237 6 99 12 34 56", role: "co_farmer", status: "active", added_at: "12/04/2026", initials: "PE" },
  { member_id: "mbr_03", full_name: "A. Fouda", identifier: "a.fouda@irad.exemple.cm", role: "advisor", status: "active", added_at: "20/09/2026", initials: "AF" },
  { member_id: "mbr_05", full_name: null, identifier: "conseiller.irad@exemple.cm", role: "advisor", status: "pending", invitation_expires_at: "2026-11-21T11:38:00Z", added_at: "14/11/2026", initials: "?" },
];

export const parcels: (Parcel & { current_crop: string; note: string })[] = [
  {
    id: "pcl_55",
    farm_id: "frm_101",
    name: "Bas-Fond Nord",
    area_ha: 4.85,
    centroid: { lat: 3.813, lon: 11.452 },
    srtm: { elevation_m: 742, slope_deg: 3.2 },
    geometry: {
      type: "Polygon",
      coordinates: [[[11.45092, 3.81242], [11.45292, 3.8122], [11.45336, 3.81375], [11.45233, 3.81427], [11.45107, 3.81405], [11.45092, 3.81242]]],
    },
    data_completeness: { local_inputs: true, history: true, preferences: true },
    last_saved_strategy: { saved_id: "hist_89", type: "recommended", score: 84.5, saved_at: "2026-11-14T11:38:00Z" },
    current_crop: "Maïs en cours",
    note: "Retenue le 14/11",
  },
  {
    id: "pcl_56",
    farm_id: "frm_101",
    name: "Colline Est",
    area_ha: 2.6,
    centroid: { lat: 3.8122, lon: 11.4567 },
    srtm: { elevation_m: 768, slope_deg: 9 },
    geometry: {
      type: "Polygon",
      coordinates: [[[11.45574, 3.81177], [11.45766, 3.81151], [11.4574, 3.813], [11.456, 3.81282], [11.45574, 3.81177]]],
    },
    data_completeness: { local_inputs: true, history: false, preferences: false },
    last_saved_strategy: null,
    current_crop: "Pente 9°",
    note: "Aucune stratégie",
  },
  {
    id: "pcl_57",
    farm_id: "frm_101",
    name: "Jardin Route",
    area_ha: 1.65,
    centroid: { lat: 3.8131, lon: 11.4478 },
    srtm: { elevation_m: 735, slope_deg: 1.8 },
    geometry: {
      type: "Polygon",
      coordinates: [[[11.44724, 3.8126], [11.44848, 3.81252], [11.44856, 3.8136], [11.44732, 3.81368], [11.44724, 3.8126]]],
    },
    data_completeness: { local_inputs: true, history: true, preferences: true },
    last_saved_strategy: { saved_id: "hist_61", type: "recommended", score: 71, saved_at: "2026-10-02T09:12:00Z" },
    current_crop: "Tomate",
    note: "Retenue le 02/10",
  },
];

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const RAIN = [22, 38, 120, 170, 210, 130, 45, 70, 230, 260, 105, 15];
const RAIN_N = [25, 50, 140, 180, 200, 150, 60, 80, 220, 290, 120, 25];
const TEMP = [25.4, 25.9, 25.6, 25.2, 24.8, 24.0, 23.3, 23.4, 23.8, 24.1, 24.6, 25.0];
const TEMP_N = [24.8, 25.3, 25.1, 24.8, 24.4, 23.6, 23.0, 23.1, 23.5, 23.8, 24.2, 24.5];
const SMAP = [-0.45, -0.3, 0.1, 0.2, 0.15, -0.1, -0.35, -0.2, 0.25, 0.3, 0.0, -0.4];
const NDVI = [0.38, 0.35, 0.45, 0.58, 0.66, 0.62, 0.48, 0.44, 0.6, 0.7, 0.6, 0.45];
const ETP = [96, 98, 105, 102, 98, 90, 85, 86, 92, 95, 96, 95];

export const climate: ClimateResponse = {
  parcel_id: "pcl_55",
  data_source_status: "live",
  cached_at: null,
  grid_resolution_note: "NASA POWER (55×70 km), SMAP (9 km), MODIS NDVI (250 m).",
  monthly_series: MONTHS.map((label, i) => ({
    month: i + 1,
    label,
    temp_avg_c: TEMP[i],
    temp_normal_c: TEMP_N[i],
    rain_mm: RAIN[i],
    rain_normal_mm: RAIN_N[i],
    soil_moisture_anomaly: SMAP[i],
    ndvi: NDVI[i],
    evapotranspiration_mm: ETP[i],
    water_balance_mm: RAIN[i] - ETP[i],
    frost_risk: 0,
    quality: i === 7 ? "interpolated" : "ok",
    alerts: [
      ...(i <= 1 || i === 11 ? (["dry_season", "water_stress"] as const) : []),
      ...(i === 6 || i === 7 ? (["bare_soil_risk"] as const) : []),
      ...(i === 9 ? (["heavy_rain"] as const) : []),
    ],
  })),
  vulnerable_periods: [
    { type: "water_stress", from_month: 12, to_month: 2 },
    { type: "bare_soil", from_month: 7, to_month: 8 },
  ],
  missing_indicators: [],
  glossary: {
    evapotranspiration: "Eau perdue par le sol et les plantes.",
    ndvi: "Indice de la vigueur de la végétation vue du ciel. Sous 0,2 = sol nu ; au-dessus de 0,6 = végétation dense.",
    soil_moisture_anomaly: "Écart entre l'humidité actuelle et la normale.",
    water_balance: "Pluie plus irrigation, moins le besoin de la culture.",
    frost_risk: "Probabilité de gel (quasi nulle à Yaoundé, utile ailleurs).",
    heat: "Température au-dessus de la limite haute de la culture : stress thermique.",
  },
};

function seq(ids: string[], scores: number[]) {
  return ids.map((id, i) => ({
    season: i + 1,
    label: SEASON_LABELS[i],
    crop_id: id,
    crop_name: CROP_BY_ID[id].name,
    season_score: scores[i],
    modified_by_user: false,
  }));
}

export const strategies: StrategiesResponse = {
  parcel_id: "pcl_55",
  computation_id: "cmp_3d9a",
  computed_at: "2026-11-14T11:30:00Z",
  data_source_status: "live",
  disclaimer:
    "Outil d'aide à la décision : ces estimations soutiennent votre jugement et ne remplacent pas l'avis d'un agronome local.",
  applied_scenario: { rain_delta_pct: 0, temp_delta_c: 0, horizon_years: 0 },
  warnings: [],
  strategies: [
    {
      id: "existing",
      type: "existing",
      name: "Rotation actuelle (référence)",
      score: 54.2,
      resilience_index: 0.68,
      confidence: { score: 0.78, level: "moyenne" },
      sequence: seq(["mais", "mais", "manioc", "mais", "mais", "manioc"], [61, 45, 70, 60, 44, 69]),
      explanation: {
        why: ["Pénalité (−25) : répétition de la famille Poaceae (maïs) sur deux saisons consécutives (règle R1)."],
        proofs: ["NASA POWER : cumul pluviométrique S2 suffisant, mais anomalie SMAP négative en fin de cycle."],
        benefits: ["Débouché commercial local garanti."],
        information_gaps: ["Taux de matière organique non renseigné (valeur par défaut utilisée)."],
        local_risks_to_check: ["Risque accru de foreurs de tiges et d'épuisement en azote."],
      },
    },
    {
      id: "recommended",
      type: "recommended",
      name: "Équilibre & santé du sol",
      score: 84.5,
      resilience_index: 0.89,
      confidence: { score: 0.85, level: "élevée" },
      sequence: seq(["mais", "niebe", "manioc", "arachide", "mais", "patate_douce"], [78, 88, 82, 86, 77, 84]),
      explanation: {
        why: [
          "Le niébé (légumineuse) restaure l'azote après le maïs (règle R2).",
          "L'arachide après le manioc, culture exigeante, recharge le sol (règle R2).",
          "Aucune famille botanique répétée sur deux saisons (règle R1 respectée).",
          "Le maïs reste sensible au stress hydrique de décembre à février.",
        ],
        proofs: [
          "Humidité de surface SMAP compatible avec le cycle court du niébé (75 jours).",
          "NASA POWER : cumul de pluie S2 suffisant ; température dans la plage optimale du maïs.",
          "Vos saisies : sol argilo-limoneux, pH 5,8, pente 3,2° confirmée, sans irrigation.",
        ],
        benefits: [
          "Moins d'engrais azoté grâce à 2 légumineuses.",
          "Cultures courtes en fin de saison des pluies.",
          "Arachide et maïs : débouchés locaux saisis.",
          "Couverture rapide du sol par la patate douce (R5).",
        ],
        information_gaps: ["pH du sol saisi manuellement (5,8) — à confirmer par une analyse."],
        local_risks_to_check: [
          "Vérifier la disponibilité des semences améliorées de niébé avant la saison 2027-S2.",
          "Arachide proche de sa limite d'excès d'eau en bas-fond : vérifier le drainage.",
        ],
      },
    },
    {
      id: "alternative",
      type: "alternative",
      name: "Résilience hydrique",
      score: 79.8,
      resilience_index: 0.94,
      confidence: { score: 0.82, level: "élevée" },
      sequence: seq(["arachide", "patate_douce", "haricot", "manioc", "niebe", "patate_douce"], [81, 83, 74, 80, 85, 82]),
      explanation: {
        why: ["Cultures tolérantes à la baisse de pluie simulée ; 100 % des cultures différentes de la stratégie recommandée."],
        proofs: ["Tendances NASA POWER et SRTM (pente 3,2°) favorables à la couverture rampante de la patate douce."],
        benefits: ["Indice de stabilité de 0,94 : le score varie peu sous les scénarios de stress testés."],
        information_gaps: ["Capacité de stockage post-récolte non renseignée."],
        local_risks_to_check: ["Sensibilité de l'arachide à l'excès d'humidité en bas-fond mal drainé."],
      },
    },
  ],
};

export const STRATEGY_META = {
  existing: { tag: "Stratégie 1 · Existante", benefits: ["Débouché local garanti"] },
  recommended: { tag: "Stratégie 2 · Recommandée", benefits: ["Azote restauré", "Sol couvert", "Revenu stable"] },
  alternative: { tag: "Stratégie 3 · Alternative", benefits: ["Économie d'eau", "Faible besoin en engrais"] },
} as const;
