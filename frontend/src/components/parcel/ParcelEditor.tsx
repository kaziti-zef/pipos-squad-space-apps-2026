"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { CheckCircle2, Globe, Info, LoaderCircle, LocateFixed, MapPin, Search, Trash2, TriangleAlert, XCircle } from "lucide-react";
import { ParcelDrawMap } from "@/components/map";
import type { DrawnParcel, LocateFailure, MapFocus } from "@/components/map/ParcelDrawMap";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { useApp } from "@/lib/api/app-context";
import * as endpoints from "@/lib/api/endpoints";
import { ApiError, reaction } from "@/lib/api/errors";
import { searchPlace, type Place } from "@/lib/geocode";
import { parcels } from "@/lib/mocks";
import { fr } from "@/lib/utils";

const DEMO_OUTLINE = parcels[0].geometry.coordinates[0].slice(0, -1) as [number, number][];

/** Parcelle existante, pour la modification. */
export interface EditableParcel {
  id: string;
  name: string;
  version: number;
  /** Contour sans le point de fermeture, en [lon, lat]. */
  outline: [number, number][];
  elevation_m: number | null;
  slope_deg: number | null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-line-soft py-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Toast({ tone, icon, children }: { tone: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div role="status" className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm shadow-float ${tone}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

type Status = "idle" | "saving" | "opening" | "deleting";

/**
 * Tracé d'une parcelle (CU4) : carte plein écran + panneau d'informations.
 * - Création : POST /parcels ; le serveur valide le contour et calcule surface, altitude et pente (SRTM).
 * - Modification (\`parcel\` fourni) : PATCH /parcels/{id} (If-Match), contour envoyé seulement s'il a changé.
 * - Suppression : DELETE /parcels/{id}, réservée à l'agriculteur principal.
 * Mode démo : contour d'exemple et valeurs fixes.
 */
export function ParcelEditor({ parcel, canDelete = false }: { parcel?: EditableParcel; canDelete?: boolean }) {
  const { t, lang, href } = useI18n();
  const router = useRouter();
  const { apiEnabled, farm } = useApp();
  const p = t.parcelNew;
  const editing = !!parcel;
  const initialOutline = parcel?.outline ?? (apiEnabled ? undefined : DEMO_OUTLINE);

  const [name, setName] = useState(parcel?.name ?? (apiEnabled ? "" : "Bas-Fond Nord"));
  const [status, setStatus] = useState<Status>("idle");
  const [saveError, setSaveError] = useState("");
  const [drawn, setDrawn] = useState<DrawnParcel | null>(null);
  const [error, setError] = useState("");
  const [gps, setGps] = useState<LocateFailure | "locating" | null>(null);
  // Nouvelle parcelle : on cherche la position dès l'ouverture (le navigateur demande l'autorisation).
  const [locate, setLocate] = useState(editing ? 0 : 1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [searchError, setSearchError] = useState("");
  const [focus, setFocus] = useState<MapFocus>();

  const onDenied = useCallback((reason: LocateFailure) => setGps(reason), []);
  const onLocated = useCallback(() => setGps(null), []);

  const goTo = (place: Place) => {
    setFocus({ lat: place.lat, lon: place.lon, zoom: place.zoom, key: Date.now() });
    setPlaces(null);
    setQuery(place.label.split(",")[0]);
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setSearchError("");
    setPlaces(null);
    try {
      const found = await searchPlace(query, lang);
      if (found.length === 0) setSearchError(p.searchNoResult);
      else if (found.length === 1) goTo(found[0]);
      else setPlaces(found);
    } catch {
      setSearchError(p.searchError);
    } finally {
      setSearching(false);
    }
  };

  const geometryChanged = () => {
    if (!drawn || !parcel) return true;
    const before = JSON.stringify([...parcel.outline, parcel.outline[0]].map(([a, b]) => [a.toFixed(6), b.toFixed(6)]));
    const after = JSON.stringify(drawn.coordinates.map(([a, b]) => [a.toFixed(6), b.toFixed(6)]));
    return before !== after;
  };

  const fail = (err: unknown) => {
    if (err instanceof ApiError && reaction(err) === "relogin") return router.push(href("/connexion"));
    if (err instanceof ApiError && reaction(err) === "reload_conflict") setSaveError(t.api.conflict);
    else setSaveError(err instanceof ApiError ? err.message : t.api.network);
    setStatus("idle");
  };

  const save = async () => {
    if (!apiEnabled) return router.push(href(editing ? "/tableau-de-bord" : "/parcelles/pcl_55/diagnostic"));
    if (!drawn || (!editing && !farm)) return;
    setStatus("saving");
    setSaveError("");
    try {
      const geometry = { type: "Polygon" as const, coordinates: [drawn.coordinates] };
      if (parcel) {
        await endpoints.parcels.update(
          parcel.id,
          { name: name.trim() || parcel.name, ...(geometryChanged() ? { geometry } : {}) },
          parcel.version,
        );
        setStatus("opening");
        router.push(href(`/parcelles/${parcel.id}/diagnostic`));
        router.refresh();
      } else {
        const created = await endpoints.parcels.create(farm!.id, name.trim() || p.defaultName, geometry);
        // Parcelle créée : le bouton l'indique pendant l'ouverture du diagnostic (données NASA en cours de lecture).
        setStatus("opening");
        router.push(href(`/parcelles/${created.id}/diagnostic`));
      }
    } catch (err) {
      fail(err);
    }
  };

  const remove = async () => {
    if (!parcel) return;
    setStatus("deleting");
    setSaveError("");
    try {
      await endpoints.parcels.remove(parcel.id);
      try {
        if (localStorage.getItem("agr_last_parcel") === parcel.id) localStorage.removeItem("agr_last_parcel");
      } catch {
        /* stockage indisponible */
      }
      router.push(href("/tableau-de-bord"));
      router.refresh();
    } catch (err) {
      fail(err);
      setConfirmDelete(false);
    }
  };

  const gpsMessage =
    gps === "insecure" ? p.gpsInsecure : gps === "denied" ? p.gpsDenied : gps === "unavailable" ? p.gpsUnavailable : "";
  const busy = status !== "idle";

  return (
    <main className="flex flex-1 flex-wrap">
      <div className="relative isolate min-h-[560px] min-w-0 flex-[999_1_480px] md:min-h-dvh">
        <ParcelDrawMap
          initial={initialOutline}
          onChange={setDrawn}
          onError={setError}
          locateRequest={locate}
          onLocateDenied={onDenied}
          onLocated={onLocated}
          focus={focus}
        />

        <div className="pointer-events-none absolute inset-x-4 top-4 z-[1000] flex flex-wrap items-start gap-3">
          <div className="pointer-events-auto relative max-w-[420px] flex-[1_1_280px]">
            <form role="search" onSubmit={search} className="flex min-h-12 items-center gap-1 rounded-lg bg-white pl-3.5 pr-1 shadow-float">
              <Search aria-hidden className="size-[18px] shrink-0 text-ink-muted" />
              <label className="flex-1">
                <span className="sr-only">{p.searchLabel}</span>
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchError("");
                  }}
                  placeholder={p.searchPlaceholder}
                  enterKeyHint="search"
                  className="min-h-11 w-full bg-transparent px-1.5 text-[15px] outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-forest px-3.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {searching ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
                {searching ? p.searching : p.searchButton}
              </button>
            </form>
            {places && (
              <ul aria-label={p.searchResults} className="mt-1.5 overflow-hidden rounded-lg bg-white shadow-float">
                {places.map((pl) => (
                  <li key={`${pl.lat},${pl.lon}`} className="border-b border-line-soft last:border-b-0">
                    <button type="button" onClick={() => goTo(pl)} className="flex min-h-11 w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-beige">
                      <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-forest" />
                      <span>{pl.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {searchError && (
              <p role="alert" className="mt-1.5 rounded-lg bg-warn-100 px-3.5 py-2.5 text-sm text-warn-800 shadow-float">
                {searchError}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setGps("locating");
              setLocate((n) => n + 1);
            }}
            className="pointer-events-auto inline-flex min-h-[46px] items-center gap-2 rounded-full bg-white px-[18px] text-sm font-semibold text-forest shadow-float"
          >
            {gps === "locating" ? <LoaderCircle aria-hidden className="size-[18px] animate-spin" /> : <LocateFixed aria-hidden className="size-[18px]" />}
            {gps === "locating" ? p.gpsLocating : p.myPosition}
          </button>
        </div>

        <div className="absolute bottom-5 left-1/2 z-[1000] flex w-[min(560px,calc(100%-32px))] -translate-x-1/2 flex-col gap-2.5">
          {saveError ? (
            <Toast tone="bg-danger-100 text-danger-800" icon={<XCircle aria-hidden className="size-[18px] shrink-0" />}>
              {saveError}
            </Toast>
          ) : error ? (
            <Toast tone="bg-danger-100 text-danger-800" icon={<XCircle aria-hidden className="size-[18px] shrink-0" />}>
              <strong>{p.invalid}</strong> {error}
            </Toast>
          ) : gpsMessage ? (
            <Toast tone="bg-warn-100 text-warn-800" icon={<TriangleAlert aria-hidden className="size-[18px] shrink-0" />}>
              {gpsMessage}
            </Toast>
          ) : (
            <Toast tone="bg-info-100 text-info-800" icon={<Info aria-hidden className="size-[18px] shrink-0" />}>
              {editing ? p.editHint : p.hint}
            </Toast>
          )}
        </div>
      </div>

      <aside className="box-border flex max-w-full flex-[1_1_340px] flex-col gap-5 border-l border-line-soft bg-white p-7">
        <div>
          <Link href={href("/tableau-de-bord")} className="inline-flex min-h-11 items-center text-sm font-semibold no-underline">
            {t.common.backDashboard}
          </Link>
          <h1 className="mb-1 mt-2.5 font-display text-[26px] font-bold tracking-[-0.4px]">{editing ? p.editTitle : p.pageTitle}</h1>
          <p className="text-sm text-ink-muted">{apiEnabled ? (farm?.name ?? "…") : t.common.farmName}</p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{p.nameLabel}</span>
          <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={p.defaultName} maxLength={120} />
        </label>
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[1px] text-forest">{p.auto}</p>
          <Row label={p.area} value={drawn ? `${fr(drawn.areaHa, 2, lang)} ha` : "—"} />
          <Row label={p.center} value={drawn ? `${fr(drawn.centroid.lat, 3, lang)} · ${fr(drawn.centroid.lon, 3, lang)}` : "—"} />
          <Row
            label={p.altitude}
            value={!apiEnabled ? "742 m" : parcel?.elevation_m != null && !geometryChanged() ? `${fr(parcel.elevation_m, 0, lang)} m` : p.afterSave}
          />
          <Row
            label={p.slope}
            value={!apiEnabled ? p.slopeValue : parcel?.slope_deg != null && !geometryChanged() ? `${fr(parcel.slope_deg, 1, lang)}°` : p.afterSave}
          />
        </div>
        {editing && apiEnabled && geometryChanged() && (
          <p className="rounded-md bg-warn-50 px-3 py-2.5 text-sm leading-[1.5] text-warn-800">{p.outlineChanged}</p>
        )}
        {!apiEnabled && !editing && (
          <div className="rounded-xl bg-beige p-4">
            <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold">
              <Globe aria-hidden className="size-[18px] text-info-600" />
              {p.nasaPreview}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                [p.rainYear, `${fr(1580, 0, lang)} mm`],
                [p.tempAvg, `${fr(24.1, 1, lang)} °C`],
                [p.rainySeasons, p.rainySeasonsValue],
                [p.ndvi, fr(0.58, 2, lang)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md bg-white p-3">
                  <p className="text-[13px] text-ink-muted">{k}</p>
                  <p className="mt-1 font-display text-lg font-bold">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {editing && apiEnabled && canDelete && (
          <div className="rounded-xl border border-danger-300 p-4">
            {confirmDelete ? (
              <div role="alertdialog" aria-labelledby="del-title" className="flex flex-col gap-3">
                <p id="del-title" className="text-sm leading-[1.5] text-danger-800">
                  {fmt(p.deleteConfirm, { name: parcel.name })}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={busy}>
                    {t.common.cancel}
                  </Button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={busy}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-danger-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Trash2 aria-hidden className="size-4" /> {status === "deleting" ? p.deleting : p.deleteYes}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-danger-800"
              >
                <Trash2 aria-hidden className="size-4" /> {p.delete}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2.5">
          <ButtonLink href={href("/tableau-de-bord")} variant="secondary">
            {t.common.cancel}
          </ButtonLink>
          <Button onClick={save} disabled={!drawn || busy || (apiEnabled && !editing && !farm)} className="flex-1 whitespace-nowrap">
            {status === "saving" ? (
              <>
                <LoaderCircle aria-hidden className="size-4 animate-spin" /> {t.api.pending}
              </>
            ) : status === "opening" ? (
              <>
                <CheckCircle2 aria-hidden className="size-4" /> {p.opening}
              </>
            ) : editing ? (
              p.saveEdit
            ) : (
              p.save
            )}
          </Button>
        </div>
      </aside>
    </main>
  );
}
