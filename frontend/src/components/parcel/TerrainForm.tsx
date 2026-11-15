"use client";

import { useState, type ReactNode } from "react";
import { Carrot, Lock, Wheat } from "lucide-react";
import { Banner } from "@/components/ui/Banner";
import { ButtonLink } from "@/components/ui/Button";
import { FuturePlan } from "@/components/parcel/FuturePlan";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { cn, confidenceLevel, fr } from "@/lib/utils";

/** Valeurs satellites présentées en langage courant (pas de NDVI, pas de poids affichés). */
const NASA_IDS = ["rain", "temp", "ndvi"] as const;
type NasaId = (typeof NASA_IDS)[number];
type NasaAnswer = "ok" | "fixing" | "less" | "more";

const HISTORY = [
  { label: "2025-S2", crop: "mais", icon: Wheat, bg: "bg-warn-100", fg: "text-warn-700", current: false },
  { label: "2026-S1", crop: "mais", icon: Wheat, bg: "bg-warn-100", fg: "text-warn-700", current: false },
  { label: "2026-S2", crop: "manioc", icon: Carrot, bg: "bg-root-100", fg: "text-root-800", current: true },
] as const;

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-[18px] p-[22px]">
      <h2 className="flex items-center gap-2.5 font-display text-[19px] font-semibold">
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-forest font-sans text-sm font-bold text-white">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function DefaultBadge({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full bg-stone px-2.5 py-[3px] text-[13px] font-semibold text-[#4a5a4f]">{children}</span>;
}

const choice = (selected: boolean) =>
  cn(
    "min-h-12 rounded-md border-[1.5px] px-4 text-sm font-semibold disabled:cursor-not-allowed",
    selected ? "border-forest bg-leaf-100 text-forest" : "border-field bg-white text-ink",
  );

/**
 * Données locales et corrections NASA (CU6).
 * Confiance par champ (contrat v2) : 1,0 saisi ou confirmé · 0,7 valeur satellite · 0,4 défaut régional.
 * L'indice est la moyenne des champs réellement demandés.
 */
export function TerrainForm({ parcelId, readOnly }: { parcelId: string; readOnly: boolean }) {
  const { t, lang, href } = useI18n();
  const tr = t.terrain;
  const [texture, setTexture] = useState(3);
  const [phUnknown, setPhUnknown] = useState(false);
  const [ph, setPh] = useState(5.8);
  const [organic, setOrganic] = useState(0); // 0 = « Je ne sais pas »
  const [slope, setSlope] = useState(1);
  const [irrigation, setIrrigation] = useState(false);
  const [nasa, setNasa] = useState<Partial<Record<NasaId, NasaAnswer>>>({});

  const SLOPE_UNKNOWN = tr.slopeOpts.length - 1;
  const weights = [
    1, // texture
    phUnknown ? 0.4 : 1,
    1, // drainage
    organic === 0 ? 0.4 : 1,
    slope === SLOPE_UNKNOWN ? 0.7 : 1, // à défaut, pente mesurée par satellite
    1, // irrigation
    ...(irrigation ? [1] : []), // saison sèche : demandée seulement avec irrigation
    ...NASA_IDS.map((id) => (nasa[id] && nasa[id] !== "fixing" ? 1 : 0.7)),
  ];
  const score = weights.reduce((a, b) => a + b, 0) / weights.length;
  const unknownCount = Number(phUnknown) + Number(organic === 0) + Number(slope === SLOPE_UNKNOWN);
  const level = confidenceLevel(score);
  const color = level === "élevée" ? "var(--color-forest-700)" : level === "moyenne" ? "var(--color-warn-600)" : "var(--color-danger-600)";

  return (
    <>
      {readOnly && (
        <Banner tone="readonly" className="-mx-4 md:-mx-8">
          <strong>{tr.readOnlyStrong}</strong> {tr.readOnlyText}
        </Banner>
      )}
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[3_1_520px] flex-col gap-[18px]">
          <Section n={1} title={tr.soil}>
            <div>
              <p className="mb-2 text-sm font-semibold">{tr.texture}</p>
              <div className="flex flex-wrap gap-2">
                {tr.textures.map((label, i) => (
                  <button key={label} type="button" disabled={readOnly} aria-pressed={i === texture} onClick={() => setTexture(i)} className={choice(i === texture)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <p className="text-sm font-semibold">
                  {tr.ph} <span className="font-medium text-ink-muted">{tr.phRange}</span>
                </p>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={phUnknown} disabled={readOnly} onChange={(e) => setPhUnknown(e.target.checked)} className="size-5 accent-forest" />
                  {tr.dontKnow}
                </label>
              </div>
              {phUnknown ? (
                <p className="flex flex-wrap items-center gap-2">
                  <DefaultBadge>{tr.phDefault}</DefaultBadge>
                  <span className="text-sm text-ink-muted">{tr.confidenceReduced}</span>
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-3.5">
                    <input type="range" min={3} max={10} step={0.1} value={ph} disabled={readOnly} onChange={(e) => setPh(Number(e.target.value))} aria-label={tr.ph} className="min-h-11 flex-1 accent-forest" />
                    <input
                      type="number"
                      inputMode="decimal"
                      min={3}
                      max={10}
                      step={0.1}
                      value={ph}
                      disabled={readOnly}
                      aria-label={tr.phValue}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isNaN(v)) setPh(v);
                      }}
                      onBlur={() => setPh((v) => Math.min(10, Math.max(3, Math.round(v * 10) / 10)))}
                      className="field-input w-[88px] text-center font-display text-lg font-bold"
                    />
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{tr.phHint}</p>
                </>
              )}
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
              <label>
                <p className="mb-2 text-sm font-semibold">{tr.drainage}</p>
                <select className="field-input" disabled={readOnly}>
                  {tr.drainageOpts.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label>
                <p className="mb-2 text-sm font-semibold">{tr.organic}</p>
                <select className="field-input" disabled={readOnly} value={organic} onChange={(e) => setOrganic(Number(e.target.value))}>
                  {tr.organicOpts.map((o, i) => (
                    <option key={o} value={i}>
                      {o}
                    </option>
                  ))}
                </select>
                {organic === 0 && (
                  <span className="mt-1.5 inline-block">
                    <DefaultBadge>{tr.regionalDefault}</DefaultBadge>
                  </span>
                )}
              </label>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{tr.slope}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={tr.slope}>
                {tr.slopeOpts.map((label, i) => (
                  <button key={label} type="button" disabled={readOnly} aria-pressed={i === slope} onClick={() => setSlope(i)} className={choice(i === slope)}>
                    {label}
                  </button>
                ))}
              </div>
              {slope === SLOPE_UNKNOWN && <p className="mt-2 text-sm text-ink-muted">{tr.slopeHint}</p>}
            </div>
          </Section>

          <Section n={2} title={tr.water}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
              <div>
                <p className="mb-2 text-sm font-semibold">{tr.irrigation}</p>
                <div className="flex gap-2">
                  <button type="button" disabled={readOnly} aria-pressed={irrigation} onClick={() => setIrrigation(true)} className={choice(irrigation)}>
                    {tr.yes}
                  </button>
                  <button type="button" disabled={readOnly} aria-pressed={!irrigation} onClick={() => setIrrigation(false)} className={choice(!irrigation)}>
                    {tr.no}
                  </button>
                </div>
              </div>
              {irrigation && (
                <label>
                  <p className="text-sm font-semibold">{tr.drySeason}</p>
                  <p className="mb-2 mt-0.5 text-sm text-ink-muted">{tr.dryHint}</p>
                  <select className="field-input" disabled={readOnly}>
                    {tr.dryOpts.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </Section>

          <Section n={3} title={tr.history}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
              {HISTORY.map((h) => {
                const Icon = h.icon;
                const crop = t.crops[h.crop];
                return (
                  <div key={h.label} className="flex flex-col gap-2.5 rounded-xl border-[1.5px] border-[#e8e1d4] p-3.5">
                    <span className="text-sm font-semibold text-ink-muted">
                      {h.label}
                      {h.current && ` · ${tr.inProgress}`}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className={cn("flex size-10 items-center justify-center rounded-md", h.bg)}>
                        <Icon aria-hidden className={cn("size-[22px]", h.fg)} />
                      </span>
                      <strong>{crop}</strong>
                    </div>
                    <select className="field-input" aria-label={fmt(tr.cropOf, { season: h.label })} disabled={readOnly} defaultValue={crop}>
                      <option>{crop}</option>
                      <option>{tr.fallow}</option>
                      <option>{tr.other}</option>
                    </select>
                  </div>
                );
              })}
            </div>
            <p className="rounded-sm bg-warn-50 px-3 py-2.5 text-sm text-warn-800">{tr.r1Warning}</p>
            <FuturePlan readOnly={readOnly} />
          </Section>

          <div className="flex flex-wrap justify-between gap-3">
            <ButtonLink href={href(`/parcelles/${parcelId}/diagnostic`)} variant="secondary">
              {tr.back}
            </ButtonLink>
            <ButtonLink href={href(`/parcelles/${parcelId}/priorites`)}>{tr.next}</ButtonLink>
          </div>
        </div>

        <aside className="flex flex-[1_1_300px] flex-col gap-[18px]">
          <div className="card p-5">
            <p className="eyebrow text-ink-muted">{tr.confidenceTitle}</p>
            <div className="mt-3 flex items-center gap-4">
              <div
                className="flex size-[84px] items-center justify-center rounded-full"
                style={{ background: `conic-gradient(${color} 0 ${Math.round(score * 100)}%, var(--color-line-soft) 0)` }}
              >
                <div className="flex size-[68px] items-center justify-center rounded-full bg-white font-display text-xl font-bold">{fr(score, 2, lang)}</div>
              </div>
              <div>
                <p className="font-display text-[22px] font-bold capitalize" style={{ color }}>
                  {t.levels[level]}
                </p>
                {unknownCount > 0 && <p className="mt-0.5 text-sm text-ink-muted">{fmt(tr.defaultsCount, { n: unknownCount })}</p>}
              </div>
            </div>
            {/* Échelle alignée sur les seuils : faible < 0,6 ≤ moyenne < 0,8 ≤ élevée ; repère à la position du score */}
            <div className="relative mt-5" aria-hidden>
              <div className="flex h-2 overflow-hidden rounded-lg">
                <span className="flex-[60] bg-danger-300" />
                <span className="flex-[20] bg-warn-300" />
                <span className="flex-[20] bg-leaf" />
              </div>
              <span
                className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-ink ring-2 ring-white"
                style={{ left: `${Math.round(score * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 flex text-[13px] text-ink-muted" aria-hidden>
              <span className="flex-[60]">{tr.scaleLow}</span>
              <span className="flex-[20]">{tr.scaleMid}</span>
              <span className="flex-[20] text-right">{tr.scaleHigh}</span>
            </div>
            <p className="mt-3 text-sm leading-[1.5] text-ink-muted">{tr.confidenceHint}</p>
          </div>

          <div className="card p-5">
            <p className="mb-1 font-display text-base font-semibold">{tr.nasaTitle}</p>
            <p className="mb-3 text-sm text-ink-muted">{tr.nasaText}</p>
            {NASA_IDS.map((id) => {
              const item = tr.nasa[id];
              const answer = nasa[id];
              const set = (v: NasaAnswer) => setNasa((c) => ({ ...c, [id]: v }));
              return (
                <div key={id} className="flex flex-col gap-2 border-t border-line-soft py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <strong className="font-display text-base">{item.value}</strong>
                  </div>
                  <p className="text-sm text-ink-muted">{item.meaning}</p>
                  {answer === "ok" && <span className="self-start rounded-full bg-leaf-100 px-2.5 py-1 text-[13px] font-semibold text-forest">{tr.confirmed}</span>}
                  {(answer === "less" || answer === "more") && (
                    <span className="self-start rounded-full bg-info-100 px-2.5 py-1 text-[13px] font-semibold text-info-800">
                      {fmt(tr.corrected, { value: item[answer] })}
                    </span>
                  )}
                  {answer === "fixing" && (
                    <div role="group" aria-label={tr.fixQuestion} className="flex flex-col gap-2">
                      <p className="text-sm font-semibold">{tr.fixQuestion}</p>
                      <div className="flex flex-wrap gap-2">
                        {(["less", "more"] as const).map((v) => (
                          <button key={v} type="button" onClick={() => set(v)} className="min-h-11 rounded-full border-[1.5px] border-field bg-white px-3.5 text-sm font-semibold">
                            {item[v]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {!answer && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => set("ok")}
                        className="min-h-11 rounded-full bg-forest px-3.5 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {tr.correct}
                      </button>
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => set("fixing")}
                        className="min-h-11 rounded-full border-[1.5px] border-field bg-white px-3.5 text-sm font-semibold disabled:opacity-50"
                      >
                        {tr.fix}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {readOnly && (
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-muted">
                <Lock aria-hidden className="size-3.5" /> {tr.lockNote}
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
