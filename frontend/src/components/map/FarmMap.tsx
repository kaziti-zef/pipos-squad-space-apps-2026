"use client";

import "leaflet/dist/leaflet.css";
import { useSyncExternalStore } from "react";
import { MapContainer, Polygon, TileLayer, Tooltip } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Parcel } from "@/lib/types";
import { useI18n } from "@/i18n/client";
import { fr } from "@/lib/utils";

export const ESRI_IMAGERY = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  attribution: "© Esri, Maxar, Earthstar Geographics",
};

export function toLatLngs(p: Parcel): LatLngExpression[] {
  return p.geometry.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);
}

const WIDE = "(min-width: 640px)";
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Carte de la ferme (tableau de bord, CU3) : contours des parcelles enregistrées.
 * Remplit la hauteur de son conteneur (le conteneur fixe la hauteur minimale).
 * Sur petit écran, la carte est trop dézoomée pour afficher toutes les étiquettes sans chevauchement :
 * elles s'affichent alors au toucher d'une parcelle (la liste des champs, sous la carte, donne les noms).
 */
export default function FarmMap({
  parcels,
  height = "100%",
  ariaLabel,
}: {
  parcels: Parcel[];
  height?: number | string;
  ariaLabel?: string;
}) {
  const { lang } = useI18n();
  const wide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true);
  const bounds = parcels.flatMap((p) => toLatLngs(p)) as [number, number][];
  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [40, 40] }}
      scrollWheelZoom={false}
      style={{ height, width: "100%" }}
      aria-label={ariaLabel}
    >
      <TileLayer url={ESRI_IMAGERY.url} attribution={ESRI_IMAGERY.attribution} maxZoom={19} />
      {parcels.map((p) => {
        const incomplete = !p.last_saved_strategy;
        return (
          <Polygon
            key={p.id}
            positions={toLatLngs(p)}
            pathOptions={{
              color: incomplete ? "#FCD34D" : "#86EFAC",
              weight: 3,
              dashArray: incomplete ? "8 6" : undefined,
              fillColor: incomplete ? "#F59E0B" : "#22C55E",
              fillOpacity: 0.32,
            }}
          >
            <Tooltip
              key={wide ? "permanent" : "on-tap"}
              permanent={wide}
              sticky={!wide}
              direction="center"
              className={incomplete ? "parcel-label parcel-label--warn" : "parcel-label"}
            >
              {p.name} · {fr(p.area_ha, 2, lang)} ha
            </Tooltip>
          </Polygon>
        );
      })}
    </MapContainer>
  );
}
