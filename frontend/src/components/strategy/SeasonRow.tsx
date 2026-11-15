"use client";

import { ChevronDown } from "lucide-react";
import { useSeasonText } from "@/components/ui/season";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { useApp } from "@/lib/api/app-context";
import { cropStyle } from "@/lib/domain/crops";
import type { Transition } from "@/lib/domain/simulate";
import { cn } from "@/lib/utils";

export function TransitionNote({ t: transition }: { t: Transition }) {
  const { t } = useI18n();
  if (!transition) return null;
  return (
    <div
      className={cn(
        "my-[3px] ml-[22px] flex min-h-5 items-center gap-1.5 text-[13px] font-semibold",
        transition === "R1" ? "text-danger-600" : "text-forest",
      )}
    >
      {transition === "R1" ? t.strategies.r1 : t.strategies.r2}
    </div>
  );
}

export function SeasonRow({
  label,
  cropId,
  cropName,
  index,
  modified,
  incompatible,
  excluded,
  onChange,
  compact = false,
}: {
  label: string;
  cropId: string;
  /** Nom renvoyé par l'API, pour une culture absente du dictionnaire. */
  cropName?: string;
  index: number;
  modified: boolean;
  incompatible: boolean;
  excluded?: string[];
  onChange?: (cropId: string) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const app = useApp();
  const { fromKey } = useSeasonText();
  const season = fromKey(label);
  // Démo : le gombo est exclu dans les priorités d'exemple. Backend : exclusions lues dans les préférences.
  const blocked = excluded ?? (app.apiEnabled ? [] : ["gombo"]);
  const name = (id: string) =>
    t.crops[id as keyof typeof t.crops] ?? app.cropName(id) ?? (id === cropId && cropName ? cropName : id);
  const style = cropStyle(cropId);
  return (
    <label
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg px-2.5",
        compact ? "min-h-11 bg-beige text-sm" : "min-h-11 py-2",
        !compact && (incompatible ? "bg-danger-100 outline-[1.5px] outline-danger-300 outline" : index % 2 ? "bg-sand-100" : "bg-sand-150"),
        onChange && "cursor-pointer",
      )}
    >
      <span className={cn("flex shrink-0 flex-col leading-tight", compact ? "w-[78px]" : "w-[84px]")}>
        <span className="text-[13px] font-bold text-ink-soft">{season.title}</span>
        {season.months && <span className="text-[12px] text-ink-muted">{season.months}</span>}
      </span>
      <span aria-hidden className="size-2.5 rounded-full" style={{ background: style.dot }} />
      <span className="flex-1 font-semibold">{name(cropId)}</span>
      {modified && <span className="rounded-full bg-info-100 px-2 py-0.5 text-[13px] font-semibold text-info-600">{t.strategies.modified}</span>}
      {onChange && (
        <>
          <ChevronDown aria-hidden className="size-3.5 text-ink-muted" />
          <select
            aria-label={fmt(t.strategies.changeCrop, { season: season.title })}
            value={cropId}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
          >
            {!app.cropIds.includes(cropId) && <option value={cropId}>{name(cropId)}</option>}
            {app.cropIds
              .filter((id) => !blocked.includes(id))
              .map((id) => (
                <option key={id} value={id}>
                  {name(id)}
                </option>
              ))}
          </select>
        </>
      )}
    </label>
  );
}
