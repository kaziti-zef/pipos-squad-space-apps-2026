"use client";

import { ErrorView } from "@/components/layout/ErrorView";

/** Erreur dans un écran de l'application : la barre latérale et la navigation restent disponibles. */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />;
}
