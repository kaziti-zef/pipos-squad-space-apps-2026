"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { BrandMark } from "@/components/layout/Logo";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";

/**
 * Écran d'erreur commun (audit A5, contrat §3.8) : message simple, jamais de trace technique,
 * bouton « Réessayer » et code incident à transmettre à l'équipe.
 */
export function ErrorView({ error, retry }: { error: unknown; retry: () => void }) {
  const { t, href } = useI18n();
  const e = t.errors;
  const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div role="alert" className="card flex max-w-[480px] flex-col items-center gap-4 p-8 text-center">
        <BrandMark size={56} />
        <h1 className="font-display text-2xl font-bold">{e.title}</h1>
        <p className="text-base leading-[1.55] text-ink-soft">{e.text}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button onClick={() => retry()}>
            <RotateCcw aria-hidden className="size-[18px]" /> {e.retry}
          </Button>
          <ButtonLink href={href("/tableau-de-bord")} variant="secondary">
            {e.home}
          </ButtonLink>
        </div>
        {digest && <p className="text-sm text-ink-muted">{fmt(e.code, { id: digest })}</p>}
      </div>
    </main>
  );
}
