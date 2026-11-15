"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useSeasonText } from "@/components/ui/season";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { useApp } from "@/lib/api/app-context";
import { cropStyle } from "@/lib/domain/crops";
import { seasonAt } from "@/lib/domain/seasons";

/** Le backend accepte 12 saisons au plus dans la rotation prévue. */
const MAX_PLAN = 12;

/**
 * Plan souhaité par l'agriculteur : une file de cultures, UNE culture par saison.
 * La 1re culture est semée à la prochaine saison (S1 ou S2), la 2e à la saison suivante, etc.
 * Chaque ligne affiche sa saison et ses mois pour lever toute ambiguïté (retour de test du 15/11/2026).
 * Envoyée avec les données terrain : local-inputs.planned_rotation, saison = rang dans la file.
 */
export function FuturePlan({
  readOnly,
  initial = [],
  onChange,
}: {
  readOnly: boolean;
  initial?: string[];
  onChange?: (crops: string[]) => void;
}) {
  const { t } = useI18n();
  const { cropIds, cropName } = useApp();
  const seasons = useSeasonText();
  const tr = t.terrain;
  const name = (id: string) => t.crops[id as keyof typeof t.crops] ?? cropName(id) ?? id;
  const [queue, setQueueState] = useState<{ key: number; crop: string }[]>(() => initial.map((crop, i) => ({ key: i + 1, crop })));
  const [next, setNext] = useState(cropIds[0] ?? "mais");
  const [seq, setSeq] = useState(initial.length + 1);

  /** Met à jour la file et prévient le formulaire parent (pas d'effet : appel direct dans l'événement). */
  const setQueue = (update: (q: { key: number; crop: string }[]) => { key: number; crop: string }[]) => {
    const nextQueue = update(queue);
    setQueueState(nextQueue);
    onChange?.(nextQueue.map((x) => x.crop));
  };

  const move = (i: number, d: number) =>
    setQueue((q) => {
      const c = [...q];
      [c[i], c[i + d]] = [c[i + d], c[i]];
      return c;
    });

  return (
    <div className="flex flex-col gap-3 border-t border-line-soft pt-[18px]">
      <div>
        <h3 className="font-display text-base font-semibold">{tr.planTitle}</h3>
        <p className="mt-1 text-sm leading-[1.5] text-ink-muted">{fmt(tr.planHint, { season: seasons.text(seasonAt(1)).title })}</p>
      </div>

      {queue.length === 0 ? (
        <p className="rounded-md bg-sand-100 px-3 py-3 text-sm text-ink-muted">{tr.planEmpty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {queue.map((item, i) => {
            const label = name(item.crop);
            const season = seasons.text(seasonAt(i + 1));
            return (
              <li key={item.key} className="flex items-center gap-2.5 rounded-lg bg-sand-100 py-1.5 pl-3 pr-1.5">
                <span className="flex w-[92px] shrink-0 flex-col leading-tight">
                  <span className="text-sm font-bold text-forest">{season.title}</span>
                  <span className="text-[13px] text-ink-muted">{season.months}</span>
                </span>
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: cropStyle(item.crop).dot }} />
                <span className="min-w-0 flex-1 font-semibold">{label}</span>
                {!readOnly && (
                  <span className="flex shrink-0">
                    <button
                      type="button"
                      aria-label={fmt(tr.planUp, { crop: label })}
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                      className="flex size-11 items-center justify-center rounded-full hover:bg-sand-200 disabled:opacity-30"
                    >
                      <ChevronUp aria-hidden className="size-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      aria-label={fmt(tr.planDown, { crop: label })}
                      disabled={i === queue.length - 1}
                      onClick={() => move(i, 1)}
                      className="flex size-11 items-center justify-center rounded-full hover:bg-sand-200 disabled:opacity-30"
                    >
                      <ChevronDown aria-hidden className="size-4" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      aria-label={fmt(tr.planRemove, { crop: label })}
                      onClick={() => setQueue((q) => q.filter((x) => x.key !== item.key))}
                      className="flex size-11 items-center justify-center rounded-full text-danger-600 hover:bg-danger-100"
                    >
                      <X aria-hidden className="size-4" strokeWidth={2.4} />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {!readOnly && queue.length < MAX_PLAN && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink-soft">{fmt(tr.planAddFor, { season: seasons.text(seasonAt(queue.length + 1)).title })}</span>
          <select aria-label={fmt(tr.planChooseFor, { season: seasons.text(seasonAt(queue.length + 1)).title })} value={next} onChange={(e) => setNext(e.target.value)} className="field-input min-w-0 flex-[1_1_180px]">
            <option value="jachere">{tr.fallow}</option>
            {cropIds.map((id) => (
              <option key={id} value={id}>
                {name(id)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setQueue((q) => [...q, { key: seq, crop: next }]);
              setSeq((n) => n + 1);
            }}
            className="inline-flex min-h-12 items-center gap-1.5 rounded-full bg-forest px-4 text-sm font-semibold text-white"
          >
            <Plus aria-hidden className="size-4" strokeWidth={2.4} /> {tr.planAdd}
          </button>
        </div>
      )}
    </div>
  );
}
