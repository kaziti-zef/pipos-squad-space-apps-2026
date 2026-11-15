"use client";

import { ChevronDown } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { CROPS, cropStyle } from "@/lib/domain/crops";
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
  index,
  modified,
  incompatible,
  excluded = ["gombo"],
  onChange,
  compact = false,
}: {
  label: string;
  cropId: string;
  index: number;
  modified: boolean;
  incompatible: boolean;
  excluded?: string[];
  onChange?: (cropId: string) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const name = (id: string) => t.crops[id as keyof typeof t.crops] ?? id;
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
      <span className={cn("text-[13px] font-semibold text-ink-muted", compact ? "w-[58px] text-[13px]" : "w-[62px]")}>{label}</span>
      <span aria-hidden className="size-2.5 rounded-full" style={{ background: style.dot }} />
      <span className="flex-1 font-semibold">{name(cropId)}</span>
      {modified && <span className="rounded-full bg-info-100 px-2 py-0.5 text-[13px] font-semibold text-info-600">{t.strategies.modified}</span>}
      {onChange && (
        <>
          <ChevronDown aria-hidden className="size-3.5 text-ink-muted" />
          <select
            aria-label={fmt(t.strategies.changeCrop, { season: label })}
            value={cropId}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full cursor-pointer opacity-0"
          >
            {CROPS.filter((c) => !excluded.includes(c.id)).map((c) => (
              <option key={c.id} value={c.id}>
                {name(c.id)}
              </option>
            ))}
          </select>
        </>
      )}
    </label>
  );
}
