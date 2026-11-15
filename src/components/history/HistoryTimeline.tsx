"use client";

import { useState, type ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Indicators";
import { PrintButton } from "@/components/strategy/PrintButton";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { cropStyle } from "@/lib/domain/crops";
import type { HistoryEntry, HistoryNote } from "@/lib/mocks/history";
import { cn } from "@/lib/utils";

type Filter = "all" | "strategy" | "season" | "notes";

const FILTERS: Filter[] = ["all", "strategy", "season", "notes"];

function matches(entry: HistoryEntry, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "notes") return entry.notes.length > 0;
  return entry.kind === filter;
}

function Node({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div className="relative">
      <span aria-hidden className="absolute -left-[34px] top-[18px] size-6 rounded-full border-4 border-beige" style={{ background: color }} />
      {children}
    </div>
  );
}

function Note({ note }: { note: HistoryNote }) {
  const { t } = useI18n();
  const validation = note.kind === "validation";
  return (
    <div className={cn("flex gap-2.5 rounded-md p-3 text-sm leading-[1.5]", validation ? "bg-leaf-50" : "bg-beige")}>
      <strong className="shrink-0">{note.author}</strong>
      <span>
        {validation && <Chip className="mr-1.5 bg-leaf-100 text-forest">{t.fiche.validation}</Chip>}
        {note.text}
      </span>
    </div>
  );
}

/** Historique partagé (CU12) avec filtres Tout / Stratégies / Saisons / Notes. */
export function HistoryTimeline({ entries, parcelId }: { entries: HistoryEntry[]; parcelId: string }) {
  const { t, lang, href } = useI18n();
  const h = t.history;
  const [filter, setFilter] = useState<Filter>("all");
  const visible = entries.filter((e) => matches(e, filter));
  const latestStrategy = entries.find((e) => e.kind === "strategy");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{h.eyebrow}</p>
          <h1 className="mt-1.5 font-display text-[26px] font-bold tracking-[-0.5px] md:text-[30px]">{h.title}</h1>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={h.filterLabel}>
          {FILTERS.map((value) => {
            const count = entries.filter((e) => matches(e, value)).length;
            const active = value === filter;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(value)}
                className={cn(
                  "min-h-11 rounded-full px-4 text-sm font-semibold",
                  active ? "bg-forest text-white" : "border-[1.5px] border-field bg-white text-ink hover:bg-sand-100",
                )}
              >
                {h.filters[value]}
                {value !== "all" && <span className={cn("ml-1.5", active ? "text-leaf-300" : "text-ink-muted")}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="card p-6 text-center text-ink-muted">{h.empty}</p>
      ) : (
        <div
          aria-live="polite"
          className="relative flex flex-col gap-4 pl-[34px] before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-line"
        >
          {visible.map((e) => {
            if (e.kind === "strategy") {
              const current = e === latestStrategy;
              return (
                <Node key={e.id} color={current ? "var(--color-leaf)" : "var(--color-chart-gray)"}>
                  <article className={cn("card flex flex-col gap-3", current ? "p-5" : "px-5 py-[18px] opacity-[.92]")}>
                    <div className="flex flex-wrap justify-between gap-2.5">
                      <div>
                        <p className="text-sm text-ink-muted">
                          {fmt(h.retainedBy, { date: e.saved_at, name: e.saved_by })}
                          {current && ` (${t.rolesLower[e.saved_by_role]})`}
                        </p>
                        <h2 className={cn("mt-1 font-display font-semibold", current ? "text-[19px]" : "text-[17px]")}>{e.name}</h2>
                      </div>
                      <div className="flex flex-wrap items-start gap-1.5">
                        <Chip className={current ? "bg-forest text-white" : "bg-sand-200 text-ink-soft"}>
                          {fmt(h.score, { score: e.score.toLocaleString(lang === "en" ? "en-GB" : "fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}
                        </Chip>
                        {e.confidence && <Chip className="bg-leaf-100 text-forest first-letter:uppercase">{fmt(h.confidence, { level: t.levels[e.confidence] })}</Chip>}
                        {e.scenario && <Chip className="bg-info-100 text-info-800">{fmt(h.scenario, { v: e.scenario })}</Chip>}
                        {e.outdated_geometry && <Chip className="bg-warn-100 text-warn-800">{h.outdated}</Chip>}
                      </div>
                    </div>
                    {e.sequence && (
                      <div className="flex flex-wrap gap-1.5 text-sm font-semibold">
                        {e.sequence.map((id, i) => (
                          <span key={i} className="rounded-sm px-2.5 py-1.5" style={{ background: cropStyle(id).bg }}>
                            {t.crops[id as keyof typeof t.crops]}
                          </span>
                        ))}
                      </div>
                    )}
                    {e.outdated_note && <p className="text-sm text-ink-muted">{e.outdated_note}</p>}
                    {e.notes.map((n) => (
                      <Note key={n.created_at + n.author} note={n} />
                    ))}
                    {current && (
                      <div className="flex flex-wrap gap-2">
                        <ButtonLink href={href(`/parcelles/${parcelId}/strategies/${e.strategy_id}`)} variant="secondary">
                          {h.open}
                        </ButtonLink>
                        <PrintButton />
                      </div>
                    )}
                  </article>
                </Node>
              );
            }

            const crops = e.crop_ids.map((id) => t.crops[id as keyof typeof t.crops]).join(" · ");
            const color = cropStyle(e.crop_ids[0]).dot;
            return (
              <Node key={e.id} color={color}>
                <article className="card flex flex-col gap-2.5 px-5 py-[18px]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink-muted">
                        {e.seasons}
                        {e.sown_at && ` · ${fmt(h.sownOn, { date: e.sown_at })}`}
                      </p>
                      <p className="mt-1 font-semibold">{crops}</p>
                      {e.warning && <p className="mt-1 text-sm text-danger-600">{e.warning}</p>}
                    </div>
                    <Chip style={{ background: cropStyle(e.crop_ids[0]).bg, color: cropStyle(e.crop_ids[0]).ink }}>{h.season}</Chip>
                  </div>
                  {e.notes.map((n) => (
                    <div key={n.created_at + n.author} className="text-sm text-ink-soft">
                      <span className="font-semibold text-ink">
                        {n.author} ({t.rolesLower[n.role]})
                      </span>{" "}
                      « {n.text} »
                    </div>
                  ))}
                </article>
              </Node>
            );
          })}
        </div>
      )}
    </>
  );
}
