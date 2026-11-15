"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfidenceBadge, ScoreRing, StabilityGauge } from "@/components/ui/Indicators";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { CROP_BY_ID, SEASON_LABELS } from "@/lib/domain/crops";
import { effectiveTemp, simulate, type Overrides } from "@/lib/domain/simulate";
import type { ClimateScenario, StrategiesResponse, StrategyType } from "@/lib/types";
import { cn, fr } from "@/lib/utils";
import { useRemoteStrategies } from "./remote";
import { SeasonRow, TransitionNote } from "./SeasonRow";

const NEUTRAL: ClimateScenario = { rain_delta_pct: 0, temp_delta_c: 0, horizon_years: 0 };

const TAG_STYLE: Record<StrategyType, string> = {
  existing: "bg-stone text-ink-soft",
  recommended: "bg-forest text-white",
  alternative: "bg-info-100 text-info-800",
};

/**
 * Démo : aperçu local des modifications (simulate). Backend branché : les scores viennent du serveur,
 * une modification relance le calcul (voir StrategiesLoader) ; on garde seulement les transitions R1/R2.
 */
export function useStrategySimulation(data: StrategiesResponse) {
  // Simulateur « Et si… le climat changeait ? » retiré (retour équipe) : climat actuel uniquement.
  const scenario = NEUTRAL;
  const remote = useRemoteStrategies();
  const [overrides, setOverrides] = useState<Overrides>({});
  const results = useMemo(() => {
    const r = simulate(data.strategies, scenario, remote ? {} : overrides);
    if (!remote) return r;
    return r.map((x) => ({
      ...x,
      modified: Object.fromEntries(x.base.sequence.flatMap((e, k) => (e.modified_by_user ? [[k, true]] : []))),
    }));
  }, [data, scenario, overrides, remote]);
  const best = results.reduce((b, r, i) => (r.score > results[b].score ? i : b), 0);
  const setCrop = (id: StrategyType, season: number, crop: string) =>
    remote ? remote.setCrop(id, season, crop) : setOverrides((o) => ({ ...o, [id]: { ...(o[id] ?? {}), [season]: crop } }));
  const undo = (id: StrategyType) => (remote ? remote.undo(id) : setOverrides((o) => ({ ...o, [id]: {} })));
  return { scenario, results, best, setCrop, undo, remote };
}

export function StrategiesView({ data, parcelId }: { data: StrategiesResponse; parcelId: string }) {
  const { scenario, results, best, setCrop, undo, remote } = useStrategySimulation(data);
  const { t, lang, href } = useI18n();
  const st = t.strategies;
  const temp = effectiveTemp(scenario);

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[18px]">
        {results.map((r, i) => {
          const s = r.base;
          const isBest = i === best;
          return (
            <article
              key={s.id}
              className={cn("card relative rounded-3xl p-5", isBest && "outline-[2.5px] outline-leaf outline", r.nonViable && "opacity-60")}
            >
              {isBest && (
                <span className="absolute -top-3 right-5 rounded-full bg-leaf px-3 py-[5px] text-[13px] font-bold text-forest-950">
                  {st.best}
                </span>
              )}
              <span className={cn("inline-block rounded-full px-2.5 py-1 text-[13px] font-bold", TAG_STYLE[s.id])}>
                {st.tags[s.id]}
              </span>
              <h2 className="mb-3.5 mt-2.5 font-display text-[19px] font-semibold leading-tight">{s.name}</h2>

              <div className="flex items-center gap-4">
                <ScoreRing score={r.score} />
                <div className="flex flex-1 flex-col gap-2.5">
                  <StabilityGauge resilience={r.resilience} />
                  <ConfidenceBadge score={s.confidence.score} />
                </div>
              </div>

              {r.collapsed.length > 0 && (
                <p className="mt-3.5 flex gap-2 rounded-md bg-danger-100 px-3 py-2.5 text-sm font-semibold text-danger-800">
                  <AlertTriangle aria-hidden className="size-4 shrink-0" />
                  {r.nonViable
                    ? st.nonViable
                    : fmt(st.incompatible, { crop: t.crops[r.collapsed[0] as keyof typeof t.crops], t: fr(temp, 1, lang) })}
                </p>
              )}

              <div className="mt-4 border-t border-line-soft pt-3.5">
                <p className="mb-1.5 text-[13px] font-semibold text-ink-muted">{st.sequenceHint}</p>
                {r.sequence.map((cropId, k) => (
                  <div key={k}>
                    <TransitionNote t={r.transitions[k]} />
                    <SeasonRow
                      label={s.sequence[k]?.label ?? SEASON_LABELS[k]}
                      cropId={cropId}
                      cropName={s.sequence[k]?.crop_name}
                      index={k}
                      modified={!!r.modified[k]}
                      incompatible={temp > (CROP_BY_ID[cropId]?.heatLimit ?? 99)}
                      onChange={(c) => setCrop(s.id, k, c)}
                    />
                  </div>
                ))}
                {Object.keys(r.modified).length > 0 && (
                  <button
                    type="button"
                    onClick={() => undo(s.id)}
                    className="mt-2 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-forest"
                  >
                    <RotateCcw aria-hidden className="size-3.5" /> {st.undo}
                  </button>
                )}
              </div>

              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {(remote ? s.explanation.benefits.slice(0, 3) : st.benefits[s.id]).map((b) => (
                  <span key={b} className="rounded-full bg-beige px-2.5 py-[5px] text-[13px] font-semibold text-ink-soft">
                    {b}
                  </span>
                ))}
              </div>

              <div className="mt-[18px] flex flex-wrap gap-2">
                <ButtonLink
                  href={href(remote ? remote.detailHref(s.id) : `/parcelles/${parcelId}/strategies/${s.id}`)}
                  variant="secondary"
                  className="flex-1"
                >
                  {st.details}
                </ButtonLink>
                {remote ? (
                  <Button onClick={() => remote.retain(s.id)} disabled={remote.busy} variant={isBest ? "primary" : "outline"} className="flex-1">
                    {st.retain}
                  </Button>
                ) : (
                  <ButtonLink
                    href={href(`/parcelles/${parcelId}/historique`)}
                    variant={isBest ? "primary" : "outline"}
                    className="flex-1"
                  >
                    {st.retain}
                  </ButtonLink>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
