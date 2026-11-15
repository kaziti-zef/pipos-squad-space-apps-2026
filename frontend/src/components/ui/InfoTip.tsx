"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Bulle (i) : définition en une phrase d'un terme scientifique (CU5).
 * Zone tactile de 44 px (audit A2), pastille visible de 28 px.
 */
export function InfoTip({ term, definition, className }: { term: string; definition: string; className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative -m-2", className)}>
      <button
        type="button"
        aria-label={fmt(t.common.definition, { term })}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-11 items-center justify-center rounded-full"
      >
        <span
          aria-hidden
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full border-[1.5px] font-serif text-sm font-bold",
            open ? "border-forest bg-forest text-white" : "border-field-strong bg-white text-ink-muted",
          )}
        >
          i
        </span>
      </button>
      {open && (
        <div
          id={id}
          role="tooltip"
          className="absolute right-2 top-11 z-20 w-[250px] rounded-md bg-forest px-3 py-2.5 text-sm leading-[1.45] text-white shadow-pop"
        >
          <strong>{term}</strong> : {definition}
        </div>
      )}
    </div>
  );
}
