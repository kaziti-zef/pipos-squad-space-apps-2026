"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Fait apparaître les éléments `.reveal` d'une section au défilement (charte §8). */
export function Reveal({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      // Sur réseau lent, la page est parfois déjà défilée quand le JavaScript arrive :
      // on n'anime que les sections encore sous l'écran, pour ne jamais masquer un contenu déjà lu.
      const top = root.current?.getBoundingClientRect().top ?? 0;
      if (top < window.innerHeight) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".reveal", {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: "top 80%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );
  return (
    <section ref={root} id={id} className={className}>
      {children}
    </section>
  );
}
