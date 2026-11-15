"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CloudRain, ListChecks, Sprout, ThermometerSun, TriangleAlert, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { useApp } from "@/lib/api/app-context";
import * as endpoints from "@/lib/api/endpoints";
import type { AlertCode, AppNotification } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  text: string;
  when: string;
  path: string;
  read: boolean;
}

/** Pictogramme et couleur selon le code d'alerte de la surveillance (backend T65). */
const ALERT_STYLE: Record<AlertCode, { icon: LucideIcon; tone: string }> = {
  SOWING_FAVORABLE: { icon: Sprout, tone: "bg-leaf-100 text-forest" },
  SOWING_DELAY: { icon: Sprout, tone: "bg-warn-100 text-warn-800" },
  WATER_STRESS: { icon: CloudRain, tone: "bg-warn-100 text-warn-800" },
  HEAVY_RAIN: { icon: CloudRain, tone: "bg-info-100 text-info-800" },
  HEAT_STRESS: { icon: ThermometerSun, tone: "bg-danger-100 text-danger-800" },
  SEASON_ANOMALY: { icon: TriangleAlert, tone: "bg-warn-100 text-warn-800" },
  ROTATION_MISMATCH: { icon: ListChecks, tone: "bg-danger-100 text-danger-800" },
};

const POLL_MS = 2 * 60 * 1000; // guide du kit : interroger toutes les 1 à 5 min

function relative(iso: string, lang: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

/** Cloche + panneau de notifications. Mode API : GET /notifications ; mode démo : 3 exemples. */
export function NotificationBell({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const { t, lang, href } = useI18n();
  const { apiEnabled } = useApp();
  const n = t.notifications;
  const [open, setOpen] = useState(false);
  const [apiItems, setApiItems] = useState<AppNotification[]>([]);
  const [demoRead, setDemoRead] = useState<Record<string, boolean>>({ ready: true });
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await endpoints.notifications.list({ limit: 20 });
      setApiItems(res.notifications);
    } catch {
      /* hors ligne ou session expirée : la cloche reste silencieuse */
    }
  }, []);

  useEffect(() => {
    if (!apiEnabled) return;
    const first = setTimeout(load, 0);
    const id = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [apiEnabled, load]);

  const items: Item[] = apiEnabled
    ? apiItems.map((x) => ({
        id: x.id,
        ...(ALERT_STYLE[x.code] ?? { icon: Bell, tone: "bg-sand-200 text-ink" }),
        title: x.title,
        text: x.message,
        when: relative(x.created_at, lang),
        path: `/parcelles/${x.parcel_id}/historique`,
        read: x.read,
      }))
    : (
        [
          ["sowing", Sprout, "bg-leaf-100 text-forest", "/parcelles/pcl_55/strategies/recommended"],
          ["rain", CloudRain, "bg-warn-100 text-warn-800", "/parcelles/pcl_55/diagnostic"],
          ["ready", ListChecks, "bg-info-100 text-info-800", "/parcelles/pcl_55/strategies"],
        ] as const
      ).map(([id, icon, toneCls, path]) => ({
        id,
        icon,
        tone: toneCls,
        ...n.items[id],
        text: n.items[id].text,
        path,
        read: !!demoRead[id],
      }));
  const unread = items.filter((x) => !x.read).length;

  const markRead = (id: string) => {
    if (!apiEnabled) return setDemoRead((r) => ({ ...r, [id]: true }));
    setApiItems((list) => list.map((x) => (x.id === id ? { ...x, read: true } : x)));
    void endpoints.notifications.markRead(id).catch(() => undefined);
  };
  const markAll = () => {
    if (!apiEnabled) return setDemoRead(Object.fromEntries(items.map((x) => [x.id, true])));
    setApiItems((list) => list.map((x) => ({ ...x, read: true })));
    void endpoints.notifications.markAllRead().catch(() => undefined);
  };

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
        onClick={() => {
          if (!open && apiEnabled) void load();
          setOpen((o) => !o);
        }}
        className={cn(
          "relative flex size-11 items-center justify-center rounded-full transition-colors",
          tone === "dark" ? "text-white hover:bg-white/10" : "text-forest hover:bg-sand-200",
        )}
      >
        <Bell aria-hidden className="size-[22px]" />
        {unread > 0 && (
          <span aria-hidden className="absolute right-1 top-1 flex size-[18px] items-center justify-center rounded-full bg-danger-600 text-[13px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
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
                <button type="button" onClick={markAll} className="min-h-11 whitespace-nowrap px-2 text-sm font-semibold text-forest-700">
                  {n.markAll}
                </button>
              )}
              <button type="button" aria-label={n.close} onClick={() => setOpen(false)} className="flex size-11 items-center justify-center rounded-full hover:bg-sand-100">
                <X aria-hidden className="size-5" />
              </button>
            </div>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">{n.empty}</p>
          ) : (
            <ul className="overflow-y-auto">
              {items.map((x) => {
                const Icon = x.icon;
                return (
                  <li key={x.id} className="border-b border-line-soft last:border-0">
                    <Link
                      href={href(x.path)}
                      onClick={() => {
                        markRead(x.id);
                        setOpen(false);
                      }}
                      className={cn("flex gap-3 px-4 py-3 text-ink no-underline hover:bg-sand-100 hover:text-ink", !x.read && "bg-leaf-50")}
                    >
                      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", x.tone)}>
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold">
                          {x.title}
                          {!x.read && <span aria-hidden className="size-2 shrink-0 rounded-full bg-leaf" />}
                        </span>
                        <span className="mt-0.5 block text-sm leading-[1.45] text-ink-soft">{x.text}</span>
                        <span className="mt-1 block text-[13px] text-ink-muted">{x.when}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
