import { cn } from "@/lib/utils";

const CLOUDS = [
  { top: "6%", width: 300, opacity: "opacity-[.07]", timing: "[animation-duration:95s] [animation-delay:-20s]" },
  { top: "36%", width: 200, opacity: "opacity-[.05]", timing: "[animation-duration:130s] [animation-delay:-75s]" },
  { top: "64%", width: 360, opacity: "opacity-[.06]", timing: "[animation-duration:115s] [animation-delay:-50s]" },
  { top: "82%", width: 180, opacity: "opacity-[.05]", timing: "[animation-duration:150s] [animation-delay:-110s]" },
];

/**
 * Nuages qui dérivent dans la section « Vu du ciel » (fond vert sombre) — CSS pur, composant serveur.
 * Les bords sont fondus pour qu'aucun nuage n'apparaisse coupé net.
 */
export function SkyClouds() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]"
    >
      {CLOUDS.map((c, i) => (
        <svg
          key={i}
          width={c.width}
          height={Math.round(c.width * 0.31)}
          viewBox="0 0 260 80"
          className={cn("sky-cloud blur-[1.5px]", c.opacity, c.timing)}
          style={{ top: c.top }}
        >
          <ellipse cx="70" cy="50" rx="70" ry="26" fill="#fff" />
          <ellipse cx="140" cy="36" rx="60" ry="32" fill="#fff" />
          <ellipse cx="200" cy="52" rx="58" ry="24" fill="#fff" />
        </svg>
      ))}
    </div>
  );
}
