"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/client";
import { LOCALE_COOKIE, LOCALES, localizeHref, stripLocale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Bascule FR / EN : garde la page courante et mémorise le choix (cookie lu par src/proxy.ts).
 * `tone="dark"` sur fond sombre (hero, barre latérale), `tone="light"` sur fond clair.
 */
export function LanguageSwitcher({ tone = "dark", className }: { tone?: "dark" | "light"; className?: string }) {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const base = stripLocale(pathname);

  return (
    <div
      role="group"
      aria-label={t.language.label}
      className={cn(
        "inline-flex items-center rounded-full p-0.5 text-sm font-bold",
        tone === "dark" ? "bg-white/15 ring-1 ring-white/25" : "bg-sand-200 ring-1 ring-line",
        className,
      )}
    >
      {LOCALES.map((l) => {
        const active = l === lang;
        return (
          <Link
            key={l}
            href={localizeHref(l, base)}
            hrefLang={l}
            lang={l}
            aria-current={active ? "true" : undefined}
            aria-label={t.language[l]}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={cn(
              "flex min-h-11 min-w-11 items-center justify-center rounded-full px-2.5 uppercase no-underline transition-colors",
              active
                ? tone === "dark"
                  ? "bg-white text-forest-950 hover:text-forest-950"
                  : "bg-forest text-white hover:text-white"
                : tone === "dark"
                  ? "text-white/85 hover:text-white"
                  : "text-ink-soft hover:text-ink",
            )}
          >
            {l}
          </Link>
        );
      })}
    </div>
  );
}
