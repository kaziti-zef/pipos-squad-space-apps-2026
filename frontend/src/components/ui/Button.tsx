import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "cta" | "secondary" | "outline" | "ghost-light" | "white" | "warn";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-forest text-white hover:bg-forest-950 hover:text-white",
  cta: "bg-leaf text-forest-950 hover:bg-leaf-600 hover:text-forest-950",
  secondary: "bg-sand-200 text-forest hover:bg-sand hover:text-forest",
  outline: "border-[1.5px] border-forest bg-white text-forest hover:bg-leaf-50 hover:text-forest",
  "ghost-light": "border-[1.5px] border-white/70 text-white hover:bg-white/10 hover:text-white",
  white: "bg-white text-forest shadow-float hover:text-forest",
  warn: "bg-warn-700 text-white hover:bg-warn-800 hover:text-white",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-[46px] px-[18px] text-sm",
  lg: "min-h-[54px] px-[22px] text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50 box-border";

interface Common {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: Common & ComponentProps<"button">) {
  return (
    <button type={type} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </Link>
  );
}
