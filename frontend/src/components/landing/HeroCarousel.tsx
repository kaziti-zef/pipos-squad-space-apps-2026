"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, ChevronUp, Pause, Play } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** Durée d'affichage d'une photo (ms). Pilote aussi la barre de progression (CSS). */
const SLIDE_MS = 6000;

/**
 * Cadrage par photo : `mobile` (portrait, personne centrée) et `desktop` (paysage, personne à droite,
 * hors de la colonne de texte). Valeurs = object-position horizontale.
 */
/** Les textes alternatifs sont dans le dictionnaire (landing.carousel.alts), dans le même ordre. */
const SLIDES = [
  { src: "/images/farmers/houe.jpg", mobile: "56%", desktop: "8%" },
  { src: "/images/farmers/mais.jpg", mobile: "87%", desktop: "78%" },
  { src: "/images/farmers/riziere.jpg", mobile: "79%", desktop: "68%" },
  { src: "/images/farmers/plantation.jpg", mobile: "60%", desktop: "62%" },
];

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

const railButton =
  "flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20";

/**
 * Fond du hero : carrousel automatique (fondu + léger zoom), voile de lisibilité et rail de commandes.
 * - Défilement piloté par la fin de l'animation CSS de la barre de progression (pause = animation en pause).
 * - Pause : bouton (WCAG 2.2.2), survol ou focus du rail, onglet masqué, hero hors écran.
 * - « Réduire les animations » : défilement arrêté au départ, ni zoom ni effets.
 * - Données : seule la photo affichée et la suivante sont téléchargées.
 */
export function HeroCarousel() {
  const c = useI18n().t.landing.carousel;
  const root = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  // null = l'utilisateur n'a pas encore choisi : on suit « réduire les animations ».
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(true);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  const stopped = userPaused ?? reducedMotion;
  const paused = stopped || hovered || !visible;
  const n = SLIDES.length;

  const goTo = (next: number) => {
    const target = (next + n) % n;
    if (target === index) return;
    setPrevious(index);
    setIndex(target);
    setLoaded((s) => new Set(s).add(target).add((target + 1) % n));
  };

  // Pause quand le hero sort de l'écran ou que l'onglet est masqué (batterie, données).
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let inView = true;
    const update = () => setVisible(inView && document.visibilityState === "visible");
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div ref={root} className="absolute inset-0" data-paused={paused}>
      {SLIDES.map((s, i) =>
        loaded.has(i) ? (
          <div
            key={s.src}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-out",
              i === index ? "opacity-100" : "opacity-0",
            )}
          >
            <Image
              src={s.src}
              alt={i === index ? c.alts[i] : ""}
              fill
              priority={i === 0}
              sizes="100vw"
              onLoad={() => setLoaded((set) => new Set(set).add((i + 1) % n))}
              style={{ "--pos-m": `${s.mobile} center`, "--pos-d": `${s.desktop} center` } as React.CSSProperties}
              className={cn(
                "object-cover [object-position:var(--pos-m)] md:[object-position:var(--pos-d)]",
                (i === index || i === previous) && "hero-kenburns",
              )}
            />
          </div>
        ) : null,
      )}

      {/* Mobile (portrait) : voile uniforme, le texte couvre toute la largeur. */}
      <div
        aria-hidden
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,36,20,.55) 0%, rgba(9,36,20,.62) 45%, rgba(9,36,20,.78) 100%)",
        }}
      />
      {/* Ordinateur : voile léger, concentré derrière le texte : la photo garde ses couleurs. */}
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(9,36,20,.82) 0%, rgba(9,36,20,.62) 28%, rgba(9,36,20,.22) 50%, rgba(9,36,20,0) 66%), linear-gradient(180deg, rgba(9,36,20,.45) 0%, rgba(9,36,20,0) 22%)",
        }}
      />

      {/* Rail de commandes : vertical à droite (ordinateur), horizontal en bas (mobile). */}
      <div
        className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/35 p-1 ring-1 ring-white/15 backdrop-blur-md md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:-translate-y-1/2 md:translate-x-0 md:flex-col"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
        }}
      >
        <button type="button" onClick={() => goTo(index - 1)} aria-label={c.prev} className={railButton}>
          <ChevronUp aria-hidden className="size-5 -rotate-90 md:rotate-0" />
        </button>

        <div className="flex items-center md:flex-col" role="group" aria-label={c.choose}>
          {SLIDES.map((s, i) => {
            const active = i === index;
            return (
              <button
                key={s.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={fmt(c.photoN, { n: i + 1, total: n })}
                aria-current={active ? "true" : undefined}
                className="group flex h-11 w-9 items-center justify-center md:h-12 md:w-11"
              >
                <span
                  className={cn(
                    "relative block overflow-hidden rounded-full transition-[width,height,background-color] duration-300",
                    "h-1 md:w-1",
                    active ? "w-7 bg-white/35 md:h-9" : "w-3 bg-white/55 group-hover:bg-white/85 md:h-3",
                  )}
                >
                  {active && (
                    <span
                      key={index}
                      className="hero-progress absolute inset-0 rounded-full bg-leaf"
                      style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                      onAnimationEnd={() => goTo(index + 1)}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => goTo(index + 1)} aria-label={c.next} className={railButton}>
          <ChevronDown aria-hidden className="size-5 -rotate-90 md:rotate-0" />
        </button>

        <span aria-hidden className="mx-1 h-5 w-px bg-white/30 md:mx-0 md:my-1 md:h-px md:w-5" />

        <button
          type="button"
          onClick={() => setUserPaused(!stopped)}
          aria-label={stopped ? c.play : c.pause}
          className={railButton}
        >
          {stopped ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
        </button>
      </div>
    </div>
  );
}
