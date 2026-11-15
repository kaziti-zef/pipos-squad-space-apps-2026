"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bar,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Maximize2, X } from "lucide-react";
import { InfoTip } from "@/components/ui/InfoTip";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import type { ClimateAlert, ClimateResponse } from "@/lib/api/types";
import { cn, fr, signed } from "@/lib/utils";

/** Couleurs des alertes ; les libellés sont dans le dictionnaire (diagnostic.alerts). */
const ALERT_TONE: Record<ClimateAlert, string> = {
  water_stress: "bg-warn-100 text-warn-800",
  dry_season: "bg-dry-season text-dry-season-ink",
  bare_soil_risk: "bg-sweet-100 text-sweet-800",
  heavy_rain: "bg-info-100 text-info-800",
  heat_stress: "bg-danger-100 text-danger-800",
  frost_risk: "bg-info-100 text-info-800",
};

function Legend({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="my-2 flex flex-wrap gap-3">
      {items.map(([label, swatch]) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft">
          {swatch}
          {label}
        </span>
      ))}
    </div>
  );
}

const sw = (bg: string, h = 10, extra = "") => (
  <span className={cn("inline-block w-3.5 rounded-[3px]", extra)} style={{ background: bg, height: h }} />
);

function ChartCard({
  title,
  unit,
  term,
  definition,
  legend,
  footer,
  summary,
  children,
  selected,
  onSelect,
}: {
  /** Phrase lue par les lecteurs d'écran à la place du graphique (audit A4). */
  summary: string;
  title: string;
  unit: string;
  term: string;
  definition: string;
  legend: [string, ReactNode][];
  footer: ReactNode;
  children: ReactNode;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const { t } = useI18n();
  const d = t.diagnostic;
  const [full, setFull] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);

  // Plein écran : Échap ferme, la page derrière ne défile plus, le focus revient au bouton d'ouverture.
  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    document.addEventListener("keydown", onKey);
    const back = opener.current;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      back?.focus();
    };
  }, [full]);

  const months = (
    <div className="grid grid-cols-12" role="group" aria-label={d.chooseMonth}>
      {t.monthsShort.map((m, i) => (
        <button
          key={i}
          type="button"
          aria-pressed={i === selected}
          aria-label={t.months[i]}
          onClick={() => onSelect(i)}
          className={cn(
            "min-h-11 rounded-xs text-[13px] font-semibold",
            i === selected ? "bg-forest text-white" : "text-ink-muted hover:bg-sand-200",
          )}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <div className="card px-[18px] pb-3 pt-[18px]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold">
          {title} <span className="font-sans text-sm font-medium text-ink-muted">{unit}</span>
        </h2>
        <div className="flex items-center">
          <InfoTip term={term} definition={definition} />
          <button
            ref={opener}
            type="button"
            aria-label={fmt(d.expand, { title })}
            onClick={() => setFull(true)}
            className="flex size-11 items-center justify-center rounded-full text-ink-muted hover:bg-sand-200 hover:text-ink"
          >
            <Maximize2 aria-hidden className="size-[18px]" />
          </button>
        </div>
      </div>
      <Legend items={legend} />
      {/* Toucher le graphique l'ouvre en plein écran */}
      <button type="button" onClick={() => setFull(true)} aria-label={fmt(d.expand, { title })} className="block h-[200px] w-full cursor-zoom-in">
        <span className="block size-full" role="img" aria-label={summary}>
          {children}
        </span>
      </button>
      {full && (
        <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[60] flex flex-col gap-3 bg-white p-4 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">
                {title} <span className="font-sans text-base font-medium text-ink-muted">{unit}</span>
              </h2>
              <Legend items={legend} />
            </div>
            <button
              ref={closeBtn}
              type="button"
              aria-label={d.closeFull}
              onClick={() => setFull(false)}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand-200 hover:bg-sand"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1" role="img" aria-label={summary}>
            {children}
          </div>
          {months}
          <div className="text-[13px] text-ink-muted">{footer}</div>
        </div>
      )}
      {months}
      <div className="mt-2 text-[13px] text-ink-muted">{footer}</div>
    </div>
  );
}

function Src({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full bg-info-soft px-2.5 py-[3px] text-[13px] font-semibold text-info-800">{children}</span>;
}

const MARGIN = { top: 4, right: 0, bottom: 0, left: 0 };

type Period = ClimateResponse["vulnerable_periods"][number];

/** Mois (0-11) couverts par une période, y compris à cheval sur l'année (décembre -> février). */
function spans(p: Period): [number, number][] {
  const a = p.from_month - 1, b = p.to_month - 1;
  return a <= b ? [[a, b]] : [[a, 11], [0, b]];
}

/** Bandes des périodes vulnérables renvoyées par l'API (vulnerable_periods) + mois sélectionné. */
function Bands({ periods, water = false, bare = false, sel }: { periods: Period[]; water?: boolean; bare?: boolean; sel: number }) {
  return (
    <>
      {periods.flatMap((p, k) => {
        const fill = p.type === "water_stress" && water ? "rgba(245,158,11,.28)" : p.type === "bare_soil" && bare ? "rgba(146,64,14,.18)" : null;
        return fill ? spans(p).map(([x1, x2], j) => <ReferenceArea key={`${k}-${j}`} x1={x1} x2={x2} fill={fill} ifOverflow="extendDomain" />) : [];
      })}
      <ReferenceArea x1={sel} x2={sel} fill="rgba(20,83,45,.12)" />
    </>
  );
}

/** Indicateur absent pour cette zone (missing_indicators) : message à la place du graphique. */
function Unavailable({ text }: { text: string }) {
  return <div className="flex h-full items-center justify-center rounded-md bg-sand-100 px-6 text-center text-sm text-ink-muted">{text}</div>;
}

export function ClimateDiagnostic({ data }: { data: ClimateResponse }) {
  const { t, lang } = useI18n();
  const d = t.diagnostic;
  // Année des données affichées (backend : dernière année complète) ; les données de démo n'en portent pas.
  const year = data.year ?? 2026;
  const [sel, setSel] = useState(0);
  // Barre résumé du mois (audit B6) : visible seulement quand le détail du mois est hors de l'écran
  // (sur mobile et écrans moyens, il est tout en bas, loin des graphiques où l'on clique).
  const aside = useRef<HTMLElement>(null);
  const [asideVisible, setAsideVisible] = useState(true);
  useEffect(() => {
    const el = aside.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setAsideVisible(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const series = data.monthly_series.map((m, i) => ({ ...m, i }));
  const m = data.monthly_series[sel];
  const xAxis = <XAxis dataKey="i" type="category" hide padding={{ left: 0, right: 0 }} />;
  const interpolated = series.findIndex((s) => s.quality === "interpolated");

  // Résumés textuels des graphiques, calculés à partir des données (audit A4).
  const ms = data.monthly_series;
  const extremes = (key: "rain_mm" | "temp_avg_c" | "ndvi") => {
    const vals = ms.map((x) => x[key]);
    const known = vals.filter((v): v is number => v !== null);
    if (!known.length) return { max: null, min: null, maxMonth: "—", minMonth: "—" };
    const max = Math.max(...known), min = Math.min(...known);
    return { max, min, maxMonth: t.months[vals.indexOf(max)], minMonth: t.months[vals.indexOf(min)] };
  };
  const monthsWhere = (pred: (v: number) => boolean) =>
    ms
      .map((x, i) => (x.soil_moisture_anomaly !== null && pred(x.soil_moisture_anomaly) ? t.months[i] : null))
      .filter(Boolean)
      .join(", ") || d.charts.none;
  const missing = new Set(data.missing_indicators);
  const periods = data.vulnerable_periods;
  const rainX = extremes("rain_mm"), tempX = extremes("temp_avg_c"), ndviX = extremes("ndvi");
  const summaries = {
    rain: fmt(d.charts.rain, { ...rainX, max: fr(rainX.max, 0, lang), min: fr(rainX.min, 0, lang) }),
    temp: fmt(d.charts.temp, { ...tempX, max: fr(tempX.max, 1, lang), min: fr(tempX.min, 1, lang) }),
    soil: missing.has("soil_moisture_anomaly") ? d.unavailable : fmt(d.charts.soil, { dry: monthsWhere((v) => v <= -0.2), wet: monthsWhere((v) => v >= 0.2) }),
    ndvi: missing.has("ndvi") ? d.unavailable : fmt(d.charts.ndvi, { ...ndviX, max: fr(ndviX.max, 2, lang), min: fr(ndviX.min, 2, lang) }),
  };

  return (
    <div className="flex flex-wrap items-start gap-5">
      <div className="grid min-w-0 flex-[3_1_560px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]">
        <ChartCard
          title={d.rain.title}
          unit={d.rain.unit}
          term={d.rain.term}
          definition={data.glossary.water_balance ?? d.unavailable}
          legend={[[fmt(d.rain.zone, { year }), sw("var(--color-chart-rain)")], [d.rain.normal, sw("var(--color-chart-normal)", 2)]]}
          footer={<Src>{d.rain.source}</Src>}
          summary={summaries.rain}
          selected={sel}
          onSelect={setSel}
        >
          <ResponsiveContainer>
            <ComposedChart data={series} margin={MARGIN} barCategoryGap="22%">
              {xAxis}
              <YAxis hide domain={[0, "auto"]} />
              <Bands periods={periods} water bare sel={sel} />
              <Bar dataKey="rain_mm" fill="var(--color-chart-rain)" isAnimationActive={false} />
              <Line dataKey="rain_normal_mm" stroke="var(--color-chart-normal)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={d.temp.title}
          unit={d.temp.unit}
          term={d.temp.term}
          definition={data.glossary.heat ?? d.heatDefinition}
          legend={[[fmt(d.temp.zone, { year }), sw("var(--color-chart-temp)", 3)], [d.temp.normal, sw("var(--color-chart-gray)", 2)]]}
          footer={<Src>{d.temp.source}</Src>}
          summary={summaries.temp}
          selected={sel}
          onSelect={setSel}
        >
          <ResponsiveContainer>
            <ComposedChart data={series} margin={MARGIN}>
              {xAxis}
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <Bands periods={periods} sel={sel} />
              <Line dataKey="temp_normal_c" stroke="var(--color-chart-gray)" strokeWidth={2} strokeDasharray="6 5" dot={false} isAnimationActive={false} />
              <Line dataKey="temp_avg_c" stroke="var(--color-chart-temp)" strokeWidth={3} dot={{ r: 4.5, fill: "var(--color-chart-temp)", strokeWidth: 0 }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={d.soil.title}
          unit={d.soil.unit}
          term={d.soil.term}
          definition={data.glossary.soil_moisture_anomaly ?? d.unavailable}
          legend={[[d.soil.wet, sw("var(--color-chart-wet)")], [d.soil.dry, sw("var(--color-chart-dry)")]]}
          footer={
            <>
              <Src>{d.soil.source}</Src> · {d.soil.sourceNote}
            </>
          }
          summary={summaries.soil}
          selected={sel}
          onSelect={setSel}
        >
          {missing.has("soil_moisture_anomaly") ? (
            <Unavailable text={d.unavailable} />
          ) : (
          <ResponsiveContainer>
            <ComposedChart data={series} margin={MARGIN} barCategoryGap="22%">
              {xAxis}
              <YAxis hide domain={[-0.6, 0.6]} />
              <Bands periods={periods} water sel={sel} />
              <ReferenceLine y={0} stroke="var(--color-chart-gray)" />
              <Bar dataKey="soil_moisture_anomaly" isAnimationActive={false}>
                {series.map((s) => (
                  <Cell key={s.i} fill={(s.soil_moisture_anomaly ?? 0) >= 0 ? "var(--color-chart-wet)" : "var(--color-chart-dry)"} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={d.ndvi.title}
          unit={d.ndvi.unit}
          term={d.ndvi.term}
          definition={data.glossary.ndvi ?? d.unavailable}
          legend={[
            [fmt(d.ndvi.zone, { year }), sw("var(--color-forest-700)", 3)],
            [d.ndvi.estimated, <span key="e" className="inline-block size-2.5 rounded-full border-[1.5px] border-dashed border-forest-700 bg-white" />],
          ]}
          footer={<Src>{d.ndvi.source}</Src>}
          summary={summaries.ndvi}
          selected={sel}
          onSelect={setSel}
        >
          {missing.has("ndvi") ? (
            <Unavailable text={d.unavailable} />
          ) : (
          <ResponsiveContainer>
            <ComposedChart data={series} margin={MARGIN}>
              {xAxis}
              <YAxis hide domain={[0, 1]} />
              <Bands periods={periods} bare sel={sel} />
              <ReferenceLine y={0.2} stroke="var(--color-chart-dry)" strokeDasharray="4 4" />
              <ReferenceLine y={0.6} stroke="var(--color-forest-700)" strokeDasharray="4 4" />
              <Line
                dataKey="ndvi"
                stroke="var(--color-forest-700)"
                strokeWidth={3}
                isAnimationActive={false}
                dot={(props) => {
                  const { cx, cy, index } = props as { cx: number; cy: number; index: number };
                  return index === interpolated ? (
                    <circle key={index} cx={cx} cy={cy} r={6} fill="#fff" stroke="var(--color-forest-700)" strokeWidth={2} strokeDasharray="3 2" />
                  ) : (
                    <circle key={index} cx={cx} cy={cy} r={4.5} fill="var(--color-forest-700)" />
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {!asideVisible && (
        <div
          role="region"
          aria-label={d.monthBarLabel}
          aria-live="polite"
          className="fixed inset-x-3 bottom-[84px] z-30 flex items-center gap-3 rounded-2xl bg-forest-950 px-4 py-2.5 text-white shadow-float md:inset-x-auto md:bottom-6 md:right-8 md:max-w-[520px]"
        >
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-semibold">{fmt(d.monthYear, { month: t.months[sel], year })}</p>
            <p className="truncate text-sm text-mist-soft">
              {fr(m.rain_mm, 0, lang)} mm · {fr(m.temp_avg_c, 1, lang)} °C
              {m.alerts[0] && d.alerts[m.alerts[0]] && ` · ${d.alerts[m.alerts[0]]}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => aside.current?.scrollIntoView({ block: "start" })}
            className="min-h-11 shrink-0 rounded-full bg-leaf px-4 text-sm font-semibold text-forest-950"
          >
            {d.seeDetails}
          </button>
        </div>
      )}

      <aside ref={aside} className="card flex flex-[1_1_280px] scroll-mt-6 flex-col gap-1.5 p-5">
        <p className="eyebrow text-ink-muted">{d.selectedMonth}</p>
        <h2 className="mb-2 font-display text-2xl font-bold">{fmt(d.monthYear, { month: t.months[sel], year })}</h2>
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {m.alerts.length ? (
            m.alerts.filter((a) => d.alerts[a]).map((a) => (
              <span key={a} className={cn("rounded-full px-2.5 py-1 text-[13px] font-semibold", ALERT_TONE[a])}>
                {d.alerts[a]}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-leaf-100 px-2.5 py-1 text-[13px] font-semibold text-forest">{d.noAlert}</span>
          )}
        </div>
        {[
          [d.rows.temp, `${fr(m.temp_avg_c, 1, lang)} °C ${fmt(d.normal, { v: fr(m.temp_normal_c, 1, lang) })}`],
          [d.rows.rain, `${fr(m.rain_mm, 0, lang)} mm ${fmt(d.normal, { v: fr(m.rain_normal_mm, 0, lang) })}`],
          [d.rows.etp, `${fr(m.evapotranspiration_mm, 0, lang)} mm`],
          [d.rows.wb, `${signed(m.water_balance_mm, 0, lang)} mm`],
          [d.rows.soil, signed(m.soil_moisture_anomaly, 2, lang)],
          [d.rows.ndvi, fr(m.ndvi, 2, lang)],
          [d.rows.frost, m.frost_risk > 0 ? fr(m.frost_risk, 2, lang) : d.frostNone],
          [d.rows.quality, d.quality[m.quality]],
        ].map(([k, v], i, arr) => (
          <div key={k} className={cn("flex justify-between gap-3 py-[9px] text-sm", i < arr.length - 1 && "border-b border-line-soft")}>
            <span className="text-ink-muted">{k}</span>
            <span className="text-right font-semibold">{v}</span>
          </div>
        ))}
        <div className="mt-2.5 rounded-md bg-beige p-3 text-sm leading-[1.5] text-ink-soft">
          <strong>{d.satStrong}</strong> {d.satText}
        </div>
        <p className="mt-2.5 text-[13px] leading-[1.5] text-ink-muted">{fmt(d.resolution, { v: data.grid_resolution_note })}</p>
      </aside>
    </div>
  );
}
