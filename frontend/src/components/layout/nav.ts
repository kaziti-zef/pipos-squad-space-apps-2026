import {
  BarChart3,
  Columns3,
  History,
  LayoutGrid,
  Map,
  Sprout,
  SlidersHorizontal,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { DEMO_PARCEL_ID } from "@/lib/mocks";

type NavKey = keyof Dictionary["nav"];

export interface NavItem {
  /** Chemin sans langue ; le préfixe /fr ou /en est ajouté au rendu. */
  path: string;
  label: NavKey;
  icon: LucideIcon;
  /** Segment qui rend l'élément actif. */
  match: string;
}

const p = `/parcelles/${DEMO_PARCEL_ID}`;

export const NAV_ITEMS: NavItem[] = [
  { path: "/tableau-de-bord", label: "dashboard", icon: LayoutGrid, match: "/tableau-de-bord" },
  { path: "/parcelles/nouvelle", label: "parcels", icon: Map, match: "/parcelles/nouvelle" },
  { path: `${p}/diagnostic`, label: "diagnostic", icon: BarChart3, match: "/diagnostic" },
  { path: `${p}/terrain`, label: "terrain", icon: Sprout, match: "/terrain" },
  { path: `${p}/priorites`, label: "priorities", icon: SlidersHorizontal, match: "/priorites" },
  { path: `${p}/strategies`, label: "strategies", icon: Columns3, match: "/strategies" },
  { path: `${p}/historique`, label: "history", icon: History, match: "/historique" },
  { path: "/ferme/membres", label: "members", icon: Users, match: "/ferme/membres" },
];

export const MOBILE_NAV: NavItem[] = [
  { path: "/tableau-de-bord", label: "mobileHome", icon: LayoutGrid, match: "/tableau-de-bord" },
  { path: "/parcelles/nouvelle", label: "mobileParcels", icon: Map, match: "/parcelles/nouvelle" },
  { path: `${p}/strategies`, label: "mobileStrategies", icon: Columns3, match: "/strategies" },
  { path: `${p}/historique`, label: "mobileHistory", icon: History, match: "/historique" },
  { path: "/ferme/membres", label: "mobileFarm", icon: Users, match: "/ferme/membres" },
];
