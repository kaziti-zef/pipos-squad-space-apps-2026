"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { LogOut } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { useApp } from "@/lib/api/app-context";
import { DEMO_PARCEL_ID } from "@/lib/mocks";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { MOBILE_NAV, NAV_ITEMS, navPath } from "./nav";
import { NotificationBell } from "./Notifications";

const LAST_PARCEL = "agr_last_parcel";
const noop = () => () => undefined;

/**
 * Parcelle courante pour les liens du menu : celle de l'URL, sinon la dernière consultée (mémorisée
 * dans le navigateur), sinon la parcelle de démonstration en mode démo.
 */
function useCurrentParcel(): string | null {
  const pathname = usePathname();
  const { apiEnabled } = useApp();
  const fromUrl = pathname.match(/\/parcelles\/([^/]+)/)?.[1];
  const inUrl = fromUrl && fromUrl !== "nouvelle" ? fromUrl : null;
  const stored = useSyncExternalStore(
    noop,
    () => {
      try {
        return localStorage.getItem(LAST_PARCEL);
      } catch {
        return null;
      }
    },
    () => null,
  );
  useEffect(() => {
    if (!inUrl) return;
    try {
      localStorage.setItem(LAST_PARCEL, inUrl);
    } catch {
      /* stockage indisponible : sans conséquence */
    }
  }, [inUrl]);
  return inUrl ?? stored ?? (apiEnabled ? null : DEMO_PARCEL_ID);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function Sidebar() {
  const pathname = usePathname();
  const { t, href } = useI18n();
  const { user, farms, farm, role, setFarm, logout, apiEnabled } = useApp();
  const parcelId = useCurrentParcel();
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-[22px] overflow-y-auto bg-forest-950 px-3.5 py-[22px] text-mist md:flex">
      <div className="flex items-center justify-between gap-2">
        <Logo href={href("/")} className="px-2" />
        <NotificationBell />
      </div>

      <label className="flex flex-col gap-1.5 px-1">
        <span className="text-[13px] font-semibold uppercase tracking-[1px] text-mist-muted">{t.nav.farm}</span>
        <select
          value={farm?.id ?? ""}
          onChange={(e) => setFarm(e.target.value)}
          className="min-h-11 rounded-md border border-white/20 bg-white/5 px-2.5 text-sm font-semibold text-white"
        >
          {farms.map((f) => (
            <option key={f.id} value={f.id} className="text-ink">
              {!apiEnabled && f.id === "frm_101" ? t.common.farmName : f.name}
            </option>
          ))}
        </select>
      </label>

      <nav aria-label={t.nav.menuLabel} className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.includes(item.match);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={href(navPath(item, parcelId))}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3.5 text-[15px] no-underline transition-colors",
                active
                  ? "bg-leaf font-semibold text-forest-950 hover:text-forest-950"
                  : "font-medium text-mist-200 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon aria-hidden className="size-5" />
              {t.nav[item.label]}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <LanguageSwitcher className="self-start" />
        <div className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2.5 text-sm">
          <span className={cn("size-[9px] rounded-full", apiEnabled ? "bg-leaf" : "bg-warn-300")} />
          {apiEnabled ? t.nav.nasaLive : t.api.demoMode}
        </div>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-leaf font-bold text-forest-950">
            {user ? initials(user.full_name) : "…"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.full_name ?? "…"}</p>
            <p className="text-[13px] text-mist-muted">{role ? t.roles[role] : ""}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label={t.api.logout}
            title={t.api.logout}
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-mist-200 hover:bg-white/10 hover:text-white"
          >
            <LogOut aria-hidden className="size-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { t, href } = useI18n();
  const parcelId = useCurrentParcel();
  return (
    <nav
      aria-label={t.nav.mobileLabel}
      className="no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-white px-1.5 pb-[max(10px,env(safe-area-inset-bottom))] pt-1 md:hidden"
    >
      {MOBILE_NAV.map((item) => {
        const active = pathname.includes(item.match);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={href(navPath(item, parcelId))}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-[3px] text-[13px] font-semibold no-underline",
              active ? "text-forest hover:text-forest" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
            {t.nav[item.label]}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileTopBar() {
  const { t, href } = useI18n();
  const { logout } = useApp();
  return (
    <header className="no-print flex items-center justify-between gap-3 bg-forest-950 px-4 py-3 md:hidden">
      <Logo href={href("/tableau-de-bord")} size="sm" />
      <div className="flex items-center gap-1">
        <NotificationBell />
        <LanguageSwitcher />
        <button
          type="button"
          onClick={() => void logout()}
          aria-label={t.api.logout}
          className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <LogOut aria-hidden className="size-5" />
        </button>
      </div>
    </header>
  );
}
