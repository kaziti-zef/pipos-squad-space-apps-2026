"use client";

import { useState } from "react";
import { BellRing, BellOff } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Rappels de semis et de récolte pour la stratégie affichée (retour équipe du 14/11/2026). Maquette : état local. */
export function Reminders({ crop, year }: { crop: string; year: string }) {
  const { t } = useI18n();
  const st = t.strategies;
  const [on, setOn] = useState(false);
  return (
    <section className="no-print card flex flex-wrap items-center gap-4 p-[22px]">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", on ? "bg-leaf-100 text-forest" : "bg-sand-200 text-ink-muted")}>
        {on ? <BellRing aria-hidden className="size-[22px]" /> : <BellOff aria-hidden className="size-[22px]" />}
      </span>
      <div className="min-w-0 flex-[1_1_220px]">
        <h2 className="font-display text-[17px] font-semibold">{st.remindersTitle}</h2>
        <p className="mt-0.5 text-sm text-ink-muted" aria-live="polite">
          {on ? fmt(st.remindersNext, { crop: crop.toLowerCase(), year }) : st.remindersText}
        </p>
      </div>
      <button
        type="button"
        aria-pressed={on}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "min-h-11 rounded-full border-[1.5px] px-4 text-sm font-semibold",
          on ? "border-forest bg-leaf-100 text-forest" : "border-forest bg-forest text-white",
        )}
      >
        {on ? `✓ ${st.remindersOn}` : st.remindersOff}
      </button>
    </section>
  );
}
