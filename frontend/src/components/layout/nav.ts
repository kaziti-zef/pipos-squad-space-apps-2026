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

type NavKey = keyof Dictionary["nav"];

export interface NavItem {
  /** Chemin sans langue ; le préfixe /fr ou /en est ajouté au rendu. */
  path: string;
  /** Écran d'une parcelle : le chemin est relatif à /parcelles/{id} (parcelle courante). */
  parcel?: boolean;
  label: NavKey;
  icon: LucideIcon;
  /** Segment qui rend l'élément actif. */
  match: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/tableau-de-bord", label: "dashboard", icon: LayoutGrid, match: "/tableau-de-bord" },
  { path: "/parcelles/nouvelle", label: "parcels", icon: Map, match: "/parcelles/nouvelle" },
  { path: "/diagnostic", parcel: true, label: "diagnostic", icon: BarChart3, match: "/diagnostic" },
  { path: "/terrain", parcel: true, label: "terrain", icon: Sprout, match: "/terrain" },
  { path: "/priorites", parcel: true, label: "priorities", icon: SlidersHorizontal, match: "/priorites" },
  { path: "/strategies", parcel: true, label: "strategies", icon: Columns3, match: "/strategies" },
  { path: "/historique", parcel: true, label: "history", icon: History, match: "/historique" },
  { path: "/ferme/membres", label: "members", icon: Users, match: "/ferme/membres" },
];

export const MOBILE_NAV: NavItem[] = [
  { path: "/tableau-de-bord", label: "mobileHome", icon: LayoutGrid, match: "/tableau-de-bord" },
  { path: "/parcelles/nouvelle", label: "mobileParcels", icon: Map, match: "/parcelles/nouvelle" },
  { path: "/strategies", parcel: true, label: "mobileStrategies", icon: Columns3, match: "/strategies" },
  { path: "/historique", parcel: true, label: "mobileHistory", icon: History, match: "/historique" },
  { path: "/ferme/membres", label: "mobileFarm", icon: Users, match: "/ferme/membres" },
];

/** Chemin réel d'un élément : écran de parcelle -> /parcelles/{id}/…, sinon tableau de bord pour choisir une parcelle. */
export function navPath(item: NavItem, parcelId: string | null): string {
  if (!item.parcel) return item.path;
  return parcelId ? `/parcelles/${parcelId}${item.path}` : "/tableau-de-bord";
}
