import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Pictogramme AgriRot simplifié (SVG) pour les petites tailles (≤ 40 px : barre latérale, barre mobile, onglet).
 * Reprend le logo officiel : 3 flèches de rotation (vert clair, ambre, vert forêt) autour d'une jeune pousse.
 * Le même dessin sert d'icône d'onglet : src/app/icon.svg.
 */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <g strokeWidth="4.5" strokeLinecap="round">
        <path d="M14.25 10.07A17 17 0 0 1 37.75 14.01" stroke="#4ADE80" />
        <path d="M40.94 22.52A17 17 0 0 1 25.78 40.91" stroke="#F59E0B" />
        <path d="M16.82 39.41A17 17 0 0 1 8.47 17.09" stroke="#16A34A" />
      </g>
      <path d="M39.71 17.34L41.81 11.19L32.98 15.88Z" fill="#4ADE80" />
      <path d="M21.91 40.94L26.19 45.83L26.54 35.84Z" fill="#F59E0B" />
      <path d="M10.38 13.72L4 14.98L12.48 20.28Z" fill="#16A34A" />
      <path d="M24 33V19" stroke="#15803D" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 27C19.5 27 16.5 24.2 16.3 20.2C20.4 20.2 23.4 22.6 24 27Z" fill="#22C55E" />
      <path d="M24 24C28.5 24 31.5 21.2 31.7 17.2C27.6 17.2 24.6 19.6 24 24Z" fill="#16A34A" />
      <path d="M24 20.5C22.2 18.4 22.2 15.4 24 13.2C25.8 15.4 25.8 18.4 24 20.5Z" fill="#4ADE80" />
      <path d="M18 33.5Q24 31 30 33.5" stroke="#A16207" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Pictogramme officiel détouré (PNG) pour les grandes tailles (≥ 44 px). */
export function BrandIcon({ size = 56, className, priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/agrirot-icon.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0", className)}
    />
  );
}

const SIZES = {
  sm: { icon: 30, text: "text-lg", png: false },
  md: { icon: 34, text: "text-[21px]", png: false },
  lg: { icon: 46, text: "text-2xl", png: true },
  xl: { icon: 56, text: "text-[26px]", png: true },
} as const;

/** Logo complet : pictogramme + nom en Poppins Bold (une seule police, lisible). */
export function Logo({
  href = "/",
  size = "md",
  tone = "light",
  className,
  priority,
}: {
  href?: string;
  size?: keyof typeof SIZES;
  /** `light` = texte blanc (fonds sombres), `dark` = texte vert forêt (fonds clairs). */
  tone?: "light" | "dark";
  className?: string;
  priority?: boolean;
}) {
  const s = SIZES[size];
  return (
    <Link
      href={href}
      aria-label="AgriRot"
      className={cn(
        "flex min-h-11 items-center gap-2.5 no-underline",
        tone === "light" ? "text-white hover:text-white" : "text-forest hover:text-forest",
        className,
      )}
    >
      {s.png ? <BrandIcon size={s.icon} priority={priority} /> : <BrandMark size={s.icon} />}
      <span className={cn("font-display font-bold tracking-[-0.5px]", s.text)}>AgriRot</span>
    </Link>
  );
}
