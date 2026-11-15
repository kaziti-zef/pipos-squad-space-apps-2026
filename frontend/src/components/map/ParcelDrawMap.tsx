"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Layers, Pencil, Pentagon, Trash2 } from "lucide-react";
import { useI18n } from "@/i18n/client";
import type { Dictionary } from "@/i18n/types";
import { cn } from "@/lib/utils";
import { ESRI_IMAGERY } from "./FarmMap";

export interface DrawnParcel {
  areaHa: number;
  centroid: { lat: number; lon: number };
  coordinates: [number, number][];
}

type Tool = "draw" | "edit" | null;

/** Lieu vers lequel centrer la carte (recherche) ; `key` change à chaque demande. */
export interface MapFocus {
  lat: number;
  lon: number;
  zoom: number;
  key: number;
}

/** Pourquoi la position n'a pas pu être obtenue (message adapté dans l'éditeur). */
export type LocateFailure = "insecure" | "denied" | "unavailable";

export const YAOUNDE: [number, number] = [3.8131, 11.4522];

const OSM = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap",
};

const POLY_STYLE = { color: "#ffffff", weight: 3, fillColor: "#22C55E", fillOpacity: 0.32 };

/** Leaflet.draw étend la variable globale L ; on passe toujours par elle après son chargement. */
type DrawL = typeof L & { GeometryUtil: { geodesicArea: (ll: L.LatLng[]) => number } };
const globalL = () => (window as unknown as { L: DrawL }).L;

function summarize(layer: L.Polygon): DrawnParcel {
  const ring = (layer.getLatLngs()[0] as L.LatLng[]) ?? [];
  const m2 = globalL()?.GeometryUtil?.geodesicArea(ring) ?? 0;
  const c = layer.getBounds().getCenter();
  return {
    areaHa: m2 / 10000,
    centroid: { lat: c.lat, lon: c.lng },
    coordinates: [...ring, ring[0]].map((p) => [p.lng, p.lat]),
  };
}

/** Textes de Leaflet.draw dans la langue de l'interface (appelé à chaque activation d'un outil). */
function localize(DL: DrawL, d: Dictionary["draw"]) {
  const local = DL.drawLocal;
  local.draw.handlers.polygon.tooltip = { start: d.tipStart, cont: d.tipCont, end: d.tipEnd };
  local.draw.handlers.polyline.error = d.error;
  local.edit.handlers.edit.tooltip = { text: d.editTip, subtext: d.editSub };
}

function DrawControl({
  initial,
  tool,
  clearSignal,
  onToolDone,
  onChange,
  onError,
}: {
  initial?: [number, number][];
  tool: Tool;
  clearSignal: number;
  onToolDone: () => void;
  onChange: (p: DrawnParcel | null) => void;
  onError: (message: string) => void;
}) {
  const map = useMap();
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  const group = useRef<L.FeatureGroup | null>(null);
  const cb = useRef({ onChange, onError, onToolDone });
  useEffect(() => {
    cb.current = { onChange, onError, onToolDone };
  }, [onChange, onError, onToolDone]);

  // Chargement de Leaflet.draw et du contour initial.
  useEffect(() => {
    const g = new L.FeatureGroup();
    group.current = g;
    map.addLayer(g);
    let cancelled = false;

    // Noms d'événements littéraux : le cleanup peut précéder le chargement de Leaflet.draw.
    const handlers: Record<string, L.LeafletEventHandlerFn> = {
      "draw:created": (e) => {
        g.clearLayers();
        const layer = (e as L.DrawEvents.Created).layer as L.Polygon;
        layer.setStyle(POLY_STYLE);
        g.addLayer(layer);
        cb.current.onChange(summarize(layer));
        cb.current.onToolDone();
      },
      "draw:drawstart": () => cb.current.onError(""),
      "draw:drawstop": () => cb.current.onToolDone(),
    };

    (async () => {
      (window as unknown as { L: typeof L }).L = L;
      await import("leaflet-draw");
      if (cancelled) return;
      if (initial) {
        const poly = L.polygon(initial.map(([lon, lat]) => [lat, lon] as [number, number]), POLY_STYLE);
        g.addLayer(poly);
        cb.current.onChange(summarize(poly));
        // Parcelle existante (modification) : la carte s'ouvre centrée sur son contour.
        map.fitBounds(poly.getBounds(), { maxZoom: 18, padding: [40, 40], animate: false });
      }
      map.on(handlers);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      map.off(handlers);
      map.removeLayer(g);
      group.current = null;
    };
  }, [map, initial]);

  // Outil actif : tracé ou modification des sommets.
  useEffect(() => {
    if (!ready || !tool) return;
    const DL = globalL();
    localize(DL, t.draw);
    if (tool === "draw") {
      const drawer = new DL.Draw.Polygon(map as L.DrawMap, {
        allowIntersection: false,
        showArea: true,
        metric: true,
        drawError: { color: "#B91C1C", message: DL.drawLocal.draw.handlers.polyline.error },
        shapeOptions: POLY_STYLE,
      });
      drawer.enable();
      return () => drawer.disable();
    }
    const layer = group.current?.getLayers()[0] as (L.Polygon & { editing?: { enable(): void; disable(): void } }) | undefined;
    if (!layer?.editing) {
      cb.current.onToolDone();
      return;
    }
    const update = () => cb.current.onChange(summarize(layer));
    layer.editing.enable();
    layer.on("edit", update);
    return () => {
      layer.editing?.disable();
      layer.off("edit", update);
    };
  }, [tool, ready, map, t.draw]);

  // Effacer le tracé.
  useEffect(() => {
    if (!clearSignal) return;
    group.current?.clearLayers();
    cb.current.onChange(null);
  }, [clearSignal]);

  return null;
}

/** Point bleu « vous êtes ici » et cercle de précision du GPS. */
const ME_STYLE = { radius: 8, color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 };
const ACCURACY_STYLE = { color: "#2563eb", weight: 1, fillColor: "#2563eb", fillOpacity: 0.12, interactive: false };

function Locate({
  request,
  onDenied,
  onLocated,
  label,
}: {
  request: number;
  onDenied: (reason: LocateFailure) => void;
  onLocated?: () => void;
  label: string;
}) {
  const map = useMap();
  const layers = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!request) return;
    // Le GPS du navigateur n'est disponible que sur https (ou localhost) : sur http://192.168…, il est bloqué.
    if (!window.isSecureContext) return onDenied("insecure");
    if (!("geolocation" in navigator)) return onDenied("unavailable");
    let active = true;
    // La réponse GPS peut arriver après le démontage de la carte : on l'ignore alors.
    const alive = () => active && map.getContainer().isConnected;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!alive()) return;
        const here: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        layers.current.forEach((l) => map.removeLayer(l));
        const accuracy = L.circle(here, { ...ACCURACY_STYLE, radius: Math.min(pos.coords.accuracy, 2000) });
        const dot = L.circleMarker(here, ME_STYLE).bindTooltip(label, { direction: "top", offset: [0, -8] });
        layers.current = [accuracy.addTo(map), dot.addTo(map)];
        map.flyTo(here, pos.coords.accuracy > 500 ? 15 : 17);
        onLocated?.();
      },
      (err) => {
        if (!alive()) return;
        onDenied(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
    return () => {
      active = false;
    };
  }, [request, map, onDenied, onLocated, label]);

  useEffect(
    () => () => {
      layers.current.forEach((l) => map.removeLayer(l));
    },
    [map],
  );
  return null;
}

/** Centre la carte sur le lieu choisi dans la recherche. */
function FocusOn({ focus }: { focus?: MapFocus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lon], focus.zoom);
  }, [focus, map]);
  return null;
}

function ToolButton({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        "flex size-11 items-center justify-center",
        active ? "bg-leaf text-forest-950" : "bg-white text-ink hover:bg-beige",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Carte de tracé (CU4) : Leaflet.draw piloté par la barre d'outils de la charte. */
export default function ParcelDrawMap({
  initial,
  onChange,
  onError,
  locateRequest,
  onLocateDenied,
  onLocated,
  focus,
}: {
  initial?: [number, number][];
  onChange: (p: DrawnParcel | null) => void;
  onError: (message: string) => void;
  locateRequest: number;
  onLocateDenied: (reason: LocateFailure) => void;
  onLocated?: () => void;
  focus?: MapFocus;
}) {
  const d = useI18n().t.draw;
  const [tool, setTool] = useState<Tool>(null);
  const [satellite, setSatellite] = useState(true);
  const [clearSignal, setClearSignal] = useState(0);
  const tiles = satellite ? ESRI_IMAGERY : OSM;
  const toggle = (t: Exclude<Tool, null>) => setTool((cur) => (cur === t ? null : t));

  return (
    <div className="relative h-full w-full">
      <MapContainer center={YAOUNDE} zoom={17} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <TileLayer key={tiles.url} url={tiles.url} attribution={tiles.attribution} maxZoom={19} />
        <DrawControl
          initial={initial}
          tool={tool}
          clearSignal={clearSignal}
          onToolDone={() => setTool(null)}
          onChange={onChange}
          onError={onError}
        />
        <Locate request={locateRequest} onDenied={onLocateDenied} onLocated={onLocated} label={d.youAreHere} />
        <FocusOn focus={focus} />
      </MapContainer>

      <div
        role="toolbar"
        aria-label={d.toolbar}
        className="absolute left-4 top-[140px] z-[1000] flex flex-col overflow-hidden rounded-lg shadow-float sm:top-[84px]"
      >
        <ToolButton label={d.draw} active={tool === "draw"} onClick={() => toggle("draw")}>
          <Pentagon aria-hidden className="size-5" />
        </ToolButton>
        <ToolButton label={d.edit} active={tool === "edit"} onClick={() => toggle("edit")}>
          <Pencil aria-hidden className="size-5" />
        </ToolButton>
        <ToolButton
          label={d.clear}
          onClick={() => {
            setTool(null);
            setClearSignal((n) => n + 1);
          }}
        >
          <Trash2 aria-hidden className="size-5" />
        </ToolButton>
        <ToolButton
          label={satellite ? d.showMap : d.showSatellite}
          onClick={() => setSatellite((s) => !s)}
          className="border-t border-line-soft"
        >
          <Layers aria-hidden className="size-5" />
        </ToolButton>
      </div>
    </div>
  );
}
