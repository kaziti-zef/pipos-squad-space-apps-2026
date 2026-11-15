"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { currentUser, farms } from "@/lib/mocks";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { NotificationBell } from "./Notifications";
import { MOBILE_NAV, NAV_ITEMS } from "./nav";

export function Sidebar() {
  const pathname = usePathname();
  const { t, href } = useI18n();
  return (
    <aside className="no-print sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-[22px] overflow-y-auto bg-forest-950 px-3.5 py-[22px] text-mist md:flex">
      <div className="flex items-center justify-between gap-2">
        <Logo href={href("/")} className="px-2" />
        <NotificationBell />
      </div>

      <label className="flex flex-col gap-1.5 px-1">
        <span className="text-[13px] font-semibold uppercase tracking-[1px] text-mist-muted">{t.nav.farm}</span>
        <select className="min-h-11 rounded-md border border-white/20 bg-white/5 px-2.5 text-sm font-semibold text-white">
          {farms.map((f) => (
            <option key={f.id} value={f.id} className="text-ink">
              {f.id === "frm_101" ? t.common.farmName : f.name}
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
              key={item.path}
              href={href(item.path)}
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
          <span className="size-[9px] rounded-full bg-leaf" />
          {t.nav.nasaLive}
        </div>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-10 items-center justify-center rounded-full bg-leaf font-bold text-forest-950">JM</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{currentUser.full_name}</p>
            <p className="text-[13px] text-mist-muted">{t.roles.owner}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { t, href } = useI18n();
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
            key={item.path}
            href={href(item.path)}
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
  const { href } = useI18n();
  return (
    <header className="no-print flex items-center justify-between gap-3 bg-forest-950 px-4 py-3 md:hidden">
      <Logo href={href("/tableau-de-bord")} size="sm" />
      <div className="flex items-center gap-1">
        <NotificationBell />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
