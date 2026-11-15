import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  width = "app",
  className,
}: {
  children: ReactNode;
  width?: "app" | "wide" | "narrow";
  className?: string;
}) {
  const max = { app: "max-w-app", wide: "max-w-wide", narrow: "max-w-narrow" }[width];
  return (
    <div className={cn("mx-auto box-border flex w-full flex-col gap-[22px] px-4 pb-12 pt-7 md:px-8", max, className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-sm text-ink-muted">{eyebrow}</p>}
        <h1 className="mt-1.5 font-display text-[26px] font-bold tracking-[-0.5px] md:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1.5 text-ink-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
