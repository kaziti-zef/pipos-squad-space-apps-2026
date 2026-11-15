"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/Indicators";
import { useI18n } from "@/i18n/client";
import { SEASON_LABELS } from "@/lib/domain/crops";
import type { StrategiesResponse } from "@/lib/types";
import { cn, confidenceLevel, fr, stabilityLevel } from "@/lib/utils";
import { SeasonRow } from "./SeasonRow";
import { useStrategySimulation } from "./StrategiesView";

/** Vue mobile : stratégies en onglets, simulateur repliable (écran 12 de la maquette). */
export function MobileStrategies({ data, parcelId }: { data: StrategiesResponse; parcelId: string }) {
  const { t, lang, href } = useI18n();
  const m = t.strategies.mobile;
  const { results, setCrop, remote } = useStrategySimulation(data);
  const [tab, setTab] = useState(1);
  const r = results[tab];

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={m.tabsLabel} className="flex gap-1 rounded-full bg-sand p-1">
        {m.tabs.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={i === tab}
            onClick={() => setTab(i)}
            className={cn(
              "min-h-11 flex-1 rounded-full text-sm font-semibold",
              i === tab ? "bg-forest text-white" : "text-ink-soft",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <article className="flex flex-col gap-3 rounded-[20px] bg-white p-4">
        <h2 className="font-display text-lg font-semibold">{r.base.name}</h2>
        <div className="flex items-center gap-3.5">
          <ScoreRing score={r.score} size={74} hole={58} label={false} />
          <div className="flex flex-col gap-1.5 text-sm">
            <span>
              <strong>{m.stability}</strong> · {t.indicators.stability[String(stabilityLevel(r.resilience)) as "1" | "2" | "3"]} ·{" "}
              {fr(r.resilience, 2, lang)}
            </span>
            <span>
              <strong>{m.confidence}</strong> · {t.levels[confidenceLevel(r.base.confidence.score)]}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {r.sequence.map((c, k) => (
            <SeasonRow
              key={k}
              compact
              label={r.base.sequence[k]?.label ?? SEASON_LABELS[k]}
              cropId={c}
              cropName={r.base.sequence[k]?.crop_name}
              index={k}
              modified={!!r.modified[k]}
              incompatible={false}
              excluded={remote?.excluded}
              onChange={(crop) => setCrop(r.base.id, k, crop)}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <ButtonLink
            href={href(remote ? remote.detailHref(r.base.id) : `/parcelles/${parcelId}/strategies/${r.base.id}`)}
            variant="secondary"
            className="flex-1"
          >
            {m.details}
          </ButtonLink>
          {remote ? (
            <Button onClick={() => remote.retain(r.base.id)} disabled={remote.busy} className="flex-1">
              {t.strategies.retain}
            </Button>
          ) : (
            <ButtonLink href={href(`/parcelles/${parcelId}/historique`)} className="flex-1">
              {t.strategies.retain}
            </ButtonLink>
          )}
        </div>
      </article>
    </div>
  );
}
