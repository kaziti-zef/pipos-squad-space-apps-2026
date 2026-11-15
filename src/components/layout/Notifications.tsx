"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CloudRain, Sprout, ListChecks, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { cn } from "@/lib/utils";

type NotifId = "sowing" | "rain" | "ready";

/** Notifications de démonstration ; à remplacer par l'API (alertes climat, rappels de semis, calculs terminés). */
const NOTIFS: { id: NotifId; icon: LucideIcon; tone: string; path: string }[] = [
  { id: "sowing", icon: Sprout, tone: "bg-leaf-100 text-forest", path: "/parcelles/pcl_55/strategies/recommended" },
  { id: "rain", icon: CloudRain, tone: "bg-warn-100 text-warn-800", path: "/parcelles/pcl_55/diagnostic" },
  { id: "ready", icon: ListChecks, tone: "bg-info-100 text-info-800", path: "/parcelles/pcl_55/strategies" },
];

/** Cloche + panneau de notifications (retour équipe du 14/11/2026). */
export function NotificationBell({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const { t, href } = useI18n();
  const n = t.notifications;
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Record<string, boolean>>({ ready: true });
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const unread = NOTIFS.filter((x) => !read[x.id]).length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={fmt(n.open, { n: unread })}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex size-11 items-center justify-center rounded-full transition-colors",
          tone === "dark" ? "text-white hover:bg-white/10" : "text-forest hover:bg-sand-200",
        )}
      >
        <Bell aria-hidden className="size-[22px]" />
        {unread > 0 && (
          <span aria-hidden className="absolute right-1 top-1 flex size-[18px] items-center justify-center rounded-full bg-danger-600 text-[13px] font-bold leading-none text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={n.title}
          className="fixed inset-x-3 top-16 z-50 flex max-h-[70dvh] flex-col overflow-hidden rounded-2xl bg-white text-ink shadow-pop md:inset-x-auto md:left-[260px] md:top-4 md:w-[380px]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line-soft px-4 py-2">
            <h2 className="font-display text-base font-semibold">{n.title}</h2>
            <div className="flex items-center">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => setRead(Object.fromEntries(NOTIFS.map((x) => [x.id, true])))}
                  className="min-h-11 whitespace-nowrap px-2 text-sm font-semibold text-forest-700"
                >
                  {n.markAll}
                </button>
              )}
              <button type="button" aria-label={n.close} onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full hover:bg-sand-100">
                <X aria-hidden className="size-5" />
              </button>
            </div>
          </div>
          <ul className="overflow-y-auto">
            {NOTIFS.map((x) => {
              const item = n.items[x.id];
              const Icon = x.icon;
              return (
                <li key={x.id} className="border-b border-line-soft last:border-0">
                  <Link
                    href={href(x.path)}
                    onClick={() => {
                      setRead((r) => ({ ...r, [x.id]: true }));
                      setOpen(false);
                    }}
                    className={cn("flex gap-3 px-4 py-3 text-ink no-underline hover:bg-sand-100 hover:text-ink", !read[x.id] && "bg-leaf-50")}
                  >
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", x.tone)}>
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 font-semibold">
                        {item.title}
                        {!read[x.id] && <span aria-hidden className="size-2 rounded-full bg-leaf" />}
                      </span>
                      <span className="mt-0.5 block text-sm leading-[1.45] text-ink-soft">{item.text}</span>
                      <span className="mt-1 block text-[13px] text-ink-muted">{item.when}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
