"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, CircleDollarSign, Droplet, Leaf, Mountain, Shovel, Wheat, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { CROPS } from "@/lib/domain/crops";
import type { PriorityKey } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Pictogrammes et couleurs ; les libellés sont dans le dictionnaire (priorities.labels). */
const META: Record<PriorityKey, { icon: LucideIcon; bg: string; fg: string }> = {
  water_saving: { icon: Droplet, bg: "bg-info-100", fg: "text-info-600" },
  income: { icon: CircleDollarSign, bg: "bg-warn-100", fg: "text-warn-700" },
  soil_health: { icon: Shovel, bg: "bg-root-100", fg: "text-root-800" },
  nitrogen: { icon: Leaf, bg: "bg-leaf-100", fg: "text-forest" },
  erosion_control: { icon: Mountain, bg: "bg-sweet-100", fg: "text-sweet-800" },
  fodder: { icon: Wheat, bg: "bg-yam-100", fg: "text-yam-800" },
};

const DEFAULT_ORDER: PriorityKey[] = ["income", "water_saving", "soil_health", "nitrogen", "erosion_control", "fodder"];

const tog = "inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-semibold";

/**
 * Priorités et contraintes (CU7). L'ordre suffit à l'agriculteur : les poids (par rangs, somme = 1)
 * sont calculés sans être affichés, puis envoyés via PUT /preferences.
 * Équipement, main-d'œuvre et débouché local retirés (retours équipe du 14/11/2026).
 */
export function PrioritiesForm({ parcelId }: { parcelId: string }) {
  const { t, href } = useI18n();
  const pr = t.priorities;
  const [order, setOrder] = useState<PriorityKey[]>(["water_saving", "income", "soil_health", "nitrogen", "erosion_control", "fodder"]);
  const [excluded, setExcluded] = useState<Record<string, boolean>>({ gombo: true });

  const n = order.length;
  const move = (i: number, d: number) =>
    setOrder((o) => {
      const c = [...o];
      [c[i], c[i + d]] = [c[i + d], c[i]];
      return c;
    });
  const excludedCount = Object.values(excluded).filter(Boolean).length;

  return (
    <>
      <div className="flex flex-wrap items-start gap-5">
        <section className="card flex-[1_1_420px] p-[22px]">
          <h2 className="mb-3.5 font-display text-[19px] font-semibold">{pr.orderTitle}</h2>
          <ol className="flex flex-col gap-2">
            {order.map((k, i) => {
              const m = META[k];
              const Icon = m.icon;
              return (
                <li key={k} className="flex items-center gap-3 rounded-lg border border-line-soft bg-sand-100 px-3 py-2.5">
                  <span className="flex size-[30px] items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{i + 1}</span>
                  <span className={cn("flex size-[38px] items-center justify-center rounded-md", m.bg)}>
                    <Icon aria-hidden className={cn("size-5", m.fg)} />
                  </span>
                  <span className="flex-1 font-semibold">{pr.labels[k]}</span>
                  {[
                    [-1, ChevronUp, pr.up],
                    [1, ChevronDown, pr.down],
                  ].map(([d, Chev, verb]) => {
                    const C = Chev as LucideIcon;
                    const disabled = (d === -1 && i === 0) || (d === 1 && i === n - 1);
                    return (
                      <button
                        key={verb as string}
                        type="button"
                        aria-label={fmt(verb as string, { label: pr.labels[k] })}
                        disabled={disabled}
                        onClick={() => move(i, d as number)}
                        className="flex size-10 items-center justify-center rounded-sm border-[1.5px] border-field bg-white disabled:opacity-35"
                      >
                        <C aria-hidden className="size-4" strokeWidth={2.4} />
                      </button>
                    );
                  })}
                </li>
              );
            })}
          </ol>
          <button type="button" onClick={() => setOrder(DEFAULT_ORDER)} className="mt-3.5 min-h-11 text-sm font-semibold text-forest-700">
            {pr.reset}
          </button>
        </section>

        <section className="card flex flex-[1_1_420px] flex-col gap-[18px] p-[22px]">
          <h2 className="font-display text-[19px] font-semibold">{pr.constraints}</h2>
          <div>
            <p className="mb-2 text-sm font-semibold">
              {pr.exclude} <span className="font-medium text-ink-muted">{pr.excludeHint}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {CROPS.map((c) => {
                const ex = !!excluded[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={ex}
                    onClick={() => setExcluded((s) => ({ ...s, [c.id]: !ex }))}
                    className={cn(tog, ex ? "border-danger-600 bg-danger-100 text-danger-800 line-through" : "border-field bg-white")}
                  >
                    {ex && "✕ "}
                    {t.crops[c.id as keyof typeof t.crops]}
                  </button>
                );
              })}
            </div>
            {excludedCount >= 8 && (
              <p role="alert" className="mt-3 flex gap-2 rounded-md bg-warn-100 p-3 text-sm leading-[1.45] text-warn-800">
                <TriangleAlert aria-hidden className="size-[18px] shrink-0" />
                {pr.tooMany}
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <ButtonLink href={href(`/parcelles/${parcelId}/terrain`)} variant="secondary">
          {pr.back}
        </ButtonLink>
        <ButtonLink href={href(`/parcelles/${parcelId}/strategies`)} variant="cta" className="min-h-[52px] text-base">
          {pr.calculate} <ArrowRight aria-hidden className="size-[18px]" strokeWidth={2.2} />
        </ButtonLink>
      </div>
    </>
  );
}
