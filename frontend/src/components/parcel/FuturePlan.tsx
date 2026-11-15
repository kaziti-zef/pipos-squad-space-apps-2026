"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { CROPS, cropStyle } from "@/lib/domain/crops";

/**
 * Plan souhaité par l'agriculteur (retour équipe du 14/11/2026) : une simple file de cultures,
 * sans saison ni date. Envoyée avec les données terrain (local-inputs.planned_rotation, saison = rang dans la file).
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
  const tr = t.terrain;
  const name = (id: string) => t.crops[id as keyof typeof t.crops] ?? id;
  const [queue, setQueueState] = useState<{ key: number; crop: string }[]>(() => initial.map((crop, i) => ({ key: i + 1, crop })));
  const [next, setNext] = useState(CROPS[0].id);
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
        <p className="mt-1 text-sm leading-[1.5] text-ink-muted">{tr.planHint}</p>
      </div>

      {queue.length === 0 ? (
        <p className="rounded-md bg-sand-100 px-3 py-3 text-sm text-ink-muted">{tr.planEmpty}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {queue.map((item, i) => {
            const label = name(item.crop);
            return (
              <li key={item.key} className="flex items-center gap-2.5 rounded-lg bg-sand-100 py-1.5 pl-3 pr-1.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{i + 1}</span>
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: cropStyle(item.crop).dot }} />
                <span className="min-w-0 flex-1 font-semibold">{label}</span>
                {i < queue.length - 1 && (
                  <span className="hidden items-center gap-1 text-[13px] text-ink-muted sm:flex">
                    <ArrowRight aria-hidden className="size-3.5" /> {tr.planNext}
                  </span>
                )}
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

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          <select aria-label={tr.planChoose} value={next} onChange={(e) => setNext(e.target.value)} className="field-input min-w-0 flex-[1_1_180px]">
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {name(c.id)}
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
