import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

/** Année fixe : avec Cache Components, `new Date()` est interdit dans une page prérendue. */
const YEAR = 2026;

const linkClass = "inline-flex min-h-11 items-center text-[15px] text-mist-soft no-underline hover:text-white";

/** Pied de page de l'accueil — composant serveur. */
export async function Footer() {
  const { t, href } = await getI18n();
  const f = t.landing.footer;
  const columns: { title: string; links: { href: string; label: string; anchor?: boolean }[] }[] = [
    {
      title: f.discover,
      links: [
        { href: "#comment", label: t.landing.nav.how, anchor: true },
        { href: "#donnees", label: t.landing.nav.sky, anchor: true },
        { href: "#decision", label: t.landing.nav.decide, anchor: true },
      ],
    },
    {
      title: f.account,
      links: [
        { href: href("/inscription"), label: f.createAccount },
        { href: href("/connexion"), label: f.login },
        { href: href("/parcelles/pcl_55/strategies"), label: f.example },
      ],
    },
  ];

  return (
    <footer className="bg-forest-950 text-white">
      <div className="mx-auto box-border grid max-w-landing grid-cols-2 gap-x-6 gap-y-10 px-4 pb-10 pt-16 md:grid-cols-[1.4fr_1fr_1fr_1.3fr] md:gap-x-10 md:px-8">
        <div className="col-span-2 flex flex-col items-start gap-4 md:col-span-1">
          <Logo size="xl" href={href("/")} />
          <p className="max-w-[300px] text-base leading-[1.55] text-mist-soft">{f.tagline}</p>
          <LanguageSwitcher />
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="eyebrow mb-2 text-leaf-300">{col.title}</p>
            <ul className="flex flex-col">
              {col.links.map((l) => (
                <li key={l.href}>
                  {l.anchor ? (
                    <a href={l.href} className={linkClass}>
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 flex flex-col gap-3 rounded-xl border border-white/12 bg-white/5 p-5 md:col-span-1">
          <p className="flex items-center gap-2 font-display text-base font-semibold">
            <ShieldCheck aria-hidden className="size-5 text-leaf-300" />
            {f.decideTitle}
          </p>
          <p className="text-[15px] leading-[1.55] text-mist-soft">{f.decideText}</p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto box-border flex max-w-landing flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-sm text-mist-muted md:px-8">
          <span>{fmt(f.rights, { year: YEAR })}</span>
          <span>{f.credits}</span>
        </div>
      </div>
    </footer>
  );
}
