"use client";

import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import { cn, confidenceLevel, fr, scoreColor, stabilityLevel } from "@/lib/utils";

/** Anneau de score 0–100 (conic-gradient). */
export function ScoreRing({
  score,
  size = 92,
  hole = 72,
  color,
  label = true,
  className,
}: {
  score: number;
  size?: number;
  hole?: number;
  color?: string;
  label?: boolean;
  className?: string;
}) {
  const { t, lang } = useI18n();
  const c = color ?? scoreColor(score);
  return (
    <div
      role="img"
      aria-label={fmt(t.indicators.scoreAria, { score: fr(score, 1, lang) })}
      className={cn("flex shrink-0 items-center justify-center rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${c} 0 ${score}%, var(--color-line-soft) 0)`,
      }}
    >
      <div className="flex flex-col items-center justify-center rounded-full bg-white" style={{ width: hole, height: hole }}>
        <span className="font-display font-bold leading-none" style={{ fontSize: Math.round(hole / 3) }}>
          {fr(Math.round(score * 10) / 10, 1, lang)}
        </span>
        {label && <span className="text-[13px] text-ink-muted">{t.indicators.outOf100}</span>}
      </div>
    </div>
  );
}

/** Jauge de stabilité à 3 segments : jamais affichée sur 100. */
export function StabilityGauge({ resilience, className }: { resilience: number; className?: string }) {
  const { t, lang } = useI18n();
  const level = stabilityLevel(resilience);
  const color =
    level === 3 ? "var(--color-forest-700)" : level === 2 ? "var(--color-warn-600)" : "var(--color-danger-600)";
  return (
    <div className={className}>
      <p className="mb-1 text-[13px] font-semibold text-ink-muted">{t.indicators.stabilityTitle}</p>
      <div className="flex gap-[3px]" aria-hidden>
        {[1, 2, 3].map((n) => (
          <span key={n} className="h-2 flex-1 rounded" style={{ background: n <= level ? color : "var(--color-line-soft)" }} />
        ))}
      </div>
      <p className="mt-1 text-sm font-semibold">
        {t.indicators.stability[String(level) as "1" | "2" | "3"]} · {fr(resilience, 2, lang)}
      </p>
    </div>
  );
}

export function ConfidenceBadge({ score, className }: { score: number; className?: string }) {
  const { t } = useI18n();
  const level = confidenceLevel(score);
  const label = fmt(t.indicators.confidence, { level: t.levels[level] });
  return (
    <span
      className={cn(
        "inline-flex self-start rounded-full px-2.5 py-1 text-[13px] font-semibold first-letter:uppercase",
        level === "élevée" ? "bg-leaf-100 text-forest" : level === "moyenne" ? "bg-warn-100 text-warn-800" : "bg-danger-100 text-danger-800",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function Chip({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold", className)} style={style}>
      {children}
    </span>
  );
}
