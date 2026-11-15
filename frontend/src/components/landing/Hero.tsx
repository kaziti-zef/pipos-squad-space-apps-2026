import { ArrowRight, ChevronDown, Sprout } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { getI18n } from "@/i18n/server";
import { HeroCarousel } from "./HeroCarousel";

/**
 * Hero de l'accueil — composant serveur, volontairement épuré : badge, titre, phrase, deux boutons.
 * Seul le fond (carrousel + rail de commandes) est un composant client.
 * Apparition du texte en CSS (.hero-rise) : visible dès le premier affichage, sans attendre le JavaScript.
 */
export async function Hero() {
  const { t, href } = await getI18n();
  const h = t.landing.hero;
  return (
    <header className="relative isolate flex min-h-[max(640px,min(100svh,860px))] flex-col overflow-hidden bg-forest-950">
      <HeroCarousel />

      <nav
        aria-label={t.landing.nav.label}
        className="relative mx-auto box-border flex w-full max-w-landing flex-wrap items-center gap-x-8 gap-y-4 px-4 py-6 md:px-8"
      >
        <Logo href={href("/")} size="lg" priority />

        <div className="hidden flex-auto flex-wrap gap-x-7 md:flex">
          {[
            ["#comment", t.landing.nav.how],
            ["#donnees", t.landing.nav.sky],
            ["#decision", t.landing.nav.decide],
          ].map(([anchor, label]) => (
            <a key={anchor} href={anchor} className="py-3 font-medium text-white/90 no-underline hover:text-white">
              {label}
            </a>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <LanguageSwitcher />
          <ButtonLink href={href("/connexion")} variant="ghost-light" className="min-h-12 px-[22px] text-[15px]">
            {t.landing.nav.login}
          </ButtonLink>
        </div>
      </nav>

      <div className="relative mx-auto box-border flex w-full max-w-landing flex-1 items-center px-4 pb-24 pt-4 md:px-8 md:pb-16">
        <div className="flex max-w-[560px] flex-col text-white [text-shadow:0_1px_12px_rgba(9,36,20,.35)]">
          <p className="hero-rise mb-6 inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2 text-[15px] font-semibold backdrop-blur-sm [text-shadow:none] md:text-base">
            <Sprout aria-hidden className="size-[18px] text-leaf-300" />
            {h.badge}
          </p>

          <h1 className="hero-rise font-display text-[46px] font-bold leading-[1.02] tracking-[-1.5px] [animation-delay:80ms] md:text-[72px]">
            {h.title1}
            <br />
            <span className="text-leaf-300">{h.title2}</span>
          </h1>

          <p className="hero-rise mt-6 max-w-[480px] text-lg leading-[1.55] [animation-delay:160ms] md:text-xl">{h.subtitle}</p>

          <div className="hero-rise mt-9 flex flex-wrap gap-3.5 [animation-delay:240ms] [text-shadow:none]">
            <ButtonLink href={href("/inscription")} variant="cta" size="lg">
              {h.ctaStart} <ArrowRight aria-hidden className="size-[18px]" strokeWidth={2.2} />
            </ButtonLink>
            <ButtonLink
              href={href("/parcelles/pcl_55/strategies")}
              variant="ghost-light"
              size="lg"
              className="border-white/60 bg-black/20 backdrop-blur-sm"
            >
              {h.ctaExample}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-6 z-10 hidden md:block">
        <div className="mx-auto box-border max-w-landing px-8">
          <a
            href="#comment"
            className="hero-rise inline-flex items-center gap-2 rounded-full py-2 text-sm font-semibold text-white/90 no-underline [animation-delay:600ms] hover:text-white"
          >
            <ChevronDown aria-hidden className="hero-bounce size-5" />
            {h.scroll}
          </a>
        </div>
      </div>
    </header>
  );
}
