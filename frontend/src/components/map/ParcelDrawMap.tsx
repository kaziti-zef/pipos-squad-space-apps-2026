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

function Locate({ request, onDenied }: { request: number; onDenied: () => void }) {
  const map = useMap();
  useEffect(() => {
    if (!request) return;
    if (!("geolocation" in navigator)) return onDenied();
    let active = true;
    // La réponse GPS peut arriver après le démontage de la carte : on l'ignore alors.
    const fly = (target: [number, number], zoom: number) => {
      if (active && map.getContainer().isConnected) map.flyTo(target, zoom);
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => fly([pos.coords.latitude, pos.coords.longitude], 17),
      () => {
        fly(YAOUNDE, 15);
        if (active) onDenied();
      },
      { timeout: 8000 },
    );
    return () => {
      active = false;
    };
  }, [request, map, onDenied]);
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
}: {
  initial?: [number, number][];
  onChange: (p: DrawnParcel | null) => void;
  onError: (message: string) => void;
  locateRequest: number;
  onLocateDenied: () => void;
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
        <Locate request={locateRequest} onDenied={onLocateDenied} />
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
