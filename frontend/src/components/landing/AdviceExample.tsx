import { ArrowRight, Bean, Carrot, Nut, Wheat, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

const ADVICE: { crop: "mais" | "niebe" | "manioc" | "arachide"; icon: LucideIcon; tile: string; ink: string }[] = [
  { crop: "mais", icon: Wheat, tile: "bg-warn-100", ink: "text-warn-800" },
  { crop: "niebe", icon: Bean, tile: "bg-leaf-100", ink: "text-forest" },
  { crop: "manioc", icon: Carrot, tile: "bg-root-100", ink: "text-root-800" },
  { crop: "arachide", icon: Nut, tile: "bg-leaf-100", ink: "text-forest" },
];

/** Exemple concret de conseil, avec des pictogrammes pour être compris sans lire beaucoup. */
export async function AdviceExample() {
  const { t, href } = await getI18n();
  const a = t.landing.advice;
  return (
    <div className="reveal card mt-6 flex flex-wrap items-center gap-6 p-6 md:p-7">
      <div className="flex-[1_1_260px]">
        <p className="eyebrow text-forest-700">{a.eyebrow}</p>
        <p className="mt-2 font-display text-2xl font-bold leading-tight">{a.field}</p>
        <p className="mt-2 text-base leading-[1.55] text-ink-soft">
          <strong className="text-forest-700">{a.why}</strong> {a.whyText}
        </p>
        <ButtonLink href={href("/parcelles/pcl_55/strategies")} variant="secondary" className="mt-4">
          {a.cta}
        </ButtonLink>
      </div>
      {/* Mobile : grille 2 × 2 (le n° de saison donne l'ordre). À partir de 640 px : une ligne avec flèches. */}
      <ol
        className="grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:min-w-0 sm:flex-[2_1_420px] sm:items-center sm:gap-2"
        aria-label={a.order}
      >
        {ADVICE.map(({ crop, icon: Icon, tile, ink }, i) => (
          <li key={crop} className="flex min-w-0 items-center gap-2 sm:flex-1">
            <span className={cn("flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-2 py-4", tile)}>
              <span className="whitespace-nowrap text-[13px] font-semibold text-ink-muted">{fmt(a.season, { n: i + 1 })}</span>
              <Icon aria-hidden className={cn("size-8", ink)} strokeWidth={1.8} />
              <span className={cn("text-base font-semibold", ink)}>{t.crops[crop]}</span>
            </span>
            {i < ADVICE.length - 1 && <ArrowRight aria-hidden className="hidden size-5 shrink-0 text-ink-muted sm:block" />}
          </li>
        ))}
      </ol>
    </div>
  );
}
