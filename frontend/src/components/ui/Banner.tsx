"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Info, Lock, ShieldCheck, XCircle } from "lucide-react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Tone = "info" | "warn" | "danger" | "success" | "readonly" | "neutral";

const TONES: Record<Tone, string> = {
  info: "bg-info-100 text-info-800",
  warn: "bg-warn-100 text-warn-800",
  danger: "bg-danger-100 text-danger-800",
  success: "bg-forest text-white",
  readonly: "bg-info-soft text-info-800",
  neutral: "bg-sand text-ink-soft",
};

const ICONS = {
  info: Info,
  warn: AlertTriangle,
  danger: XCircle,
  success: ShieldCheck,
  readonly: Lock,
  neutral: ShieldCheck,
};

export function Banner({
  tone = "info",
  children,
  className,
  rounded = false,
  icon = true,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  rounded?: boolean;
  icon?: boolean;
}) {
  const Icon = ICONS[tone];
  return (
    <div
      role={tone === "danger" || tone === "warn" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 text-sm leading-[1.45]",
        rounded ? "rounded-md px-3.5 py-3" : "px-8 py-3",
        TONES[tone],
        className,
      )}
    >
      {icon && <Icon aria-hidden className="mt-px size-[18px] shrink-0" />}
      <div>{children}</div>
    </div>
  );
}

/** Rappel permanent : l'outil soutient la décision humaine (CU9, exigence du défi). */
export function DisclaimerBanner({ variant = "default" }: { variant?: "default" | "strategies" }) {
  const { t } = useI18n();
  return (
    <div className="no-print flex items-center gap-2.5 bg-sand px-4 py-2.5 text-sm text-ink-soft md:px-8">
      <ShieldCheck aria-hidden className="size-4 shrink-0 text-forest" />
      {variant === "strategies" ? t.common.disclaimerStrategies : t.common.disclaimer}
    </div>
  );
}
