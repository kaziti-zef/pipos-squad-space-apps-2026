"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Globe, Info, LocateFixed, Search, TriangleAlert, XCircle } from "lucide-react";
import { ParcelDrawMap } from "@/components/map";
import type { DrawnParcel } from "@/components/map/ParcelDrawMap";
import { ButtonLink } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { parcels } from "@/lib/mocks";
import { fr } from "@/lib/utils";

const INITIAL = parcels[0].geometry.coordinates[0].slice(0, -1);

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

/** Tracé d'une parcelle (CU4) : carte plein écran + panneau d'informations. */
export function ParcelEditor() {
  const { t, lang, href } = useI18n();
  const p = t.parcelNew;
  const [drawn, setDrawn] = useState<DrawnParcel | null>(null);
  const [error, setError] = useState("");
  const [gpsDenied, setGpsDenied] = useState(false);
  const [locate, setLocate] = useState(0);
  const onDenied = useCallback(() => setGpsDenied(true), []);

  return (
    <main className="flex flex-1 flex-wrap">
      <div className="relative isolate min-h-[560px] min-w-0 flex-[999_1_480px] md:min-h-dvh">
        <ParcelDrawMap initial={INITIAL} onChange={setDrawn} onError={setError} locateRequest={locate} onLocateDenied={onDenied} />

        <div className="pointer-events-none absolute inset-x-4 top-4 z-[1000] flex flex-wrap items-start gap-3">
          <label className="pointer-events-auto flex min-h-12 max-w-[420px] flex-[1_1_280px] items-center gap-2.5 rounded-lg bg-white px-3.5 shadow-float">
            <Search aria-hidden className="size-[18px] text-ink-muted" />
            <span className="sr-only">{p.searchLabel}</span>
            <input placeholder={p.searchPlaceholder} className="min-h-11 flex-1 bg-transparent text-[15px] outline-none" />
          </label>
          <button
            type="button"
            onClick={() => setLocate((n) => n + 1)}
            className="pointer-events-auto inline-flex min-h-[46px] items-center gap-2 rounded-full bg-white px-[18px] text-sm font-semibold text-forest shadow-float"
          >
            <LocateFixed aria-hidden className="size-[18px]" /> {p.myPosition}
          </button>
        </div>

        <div className="absolute bottom-5 left-1/2 z-[1000] flex w-[min(560px,calc(100%-32px))] -translate-x-1/2 flex-col gap-2.5">
          {error ? (
            <Toast tone="bg-danger-100 text-danger-800" icon={<XCircle aria-hidden className="size-[18px] shrink-0" />}>
              <strong>{p.invalid}</strong> {error}
            </Toast>
          ) : gpsDenied ? (
            <Toast tone="bg-warn-100 text-warn-800" icon={<TriangleAlert aria-hidden className="size-[18px] shrink-0" />}>
              {p.gpsDenied}
            </Toast>
          ) : (
            <Toast tone="bg-info-100 text-info-800" icon={<Info aria-hidden className="size-[18px] shrink-0" />}>
              {p.hint}
            </Toast>
          )}
        </div>
      </div>

      <aside className="box-border flex max-w-full flex-[1_1_340px] flex-col gap-5 border-l border-line-soft bg-white p-7">
        <div>
          <Link href={href("/tableau-de-bord")} className="inline-flex min-h-11 items-center text-sm font-semibold no-underline">
            {t.common.backDashboard}
          </Link>
          <h1 className="mb-1 mt-2.5 font-display text-[26px] font-bold tracking-[-0.4px]">{p.pageTitle}</h1>
          <p className="text-sm text-ink-muted">{t.common.farmName}</p>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{p.nameLabel}</span>
          <input className="field-input" defaultValue="Bas-Fond Nord" />
        </label>
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-[1px] text-forest">{p.auto}</p>
          <Row label={p.area} value={drawn ? `${fr(drawn.areaHa, 2, lang)} ha` : "—"} />
          <Row label={p.center} value={drawn ? `${fr(drawn.centroid.lat, 3, lang)} · ${fr(drawn.centroid.lon, 3, lang)}` : "—"} />
          <Row label={p.altitude} value="742 m" />
          <Row label={p.slope} value={p.slopeValue} />
        </div>
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
        <div className="mt-auto flex gap-2.5">
          <ButtonLink href={href("/tableau-de-bord")} variant="secondary">
            {t.common.cancel}
          </ButtonLink>
          <ButtonLink href={href("/parcelles/pcl_55/diagnostic")} className="flex-1 whitespace-nowrap" aria-disabled={!drawn}>
            {p.save}
          </ButtonLink>
        </div>
      </aside>
    </main>
  );
}
