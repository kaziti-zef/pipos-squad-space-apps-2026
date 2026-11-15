"use client";

import { ErrorView } from "@/components/layout/ErrorView";

/** Erreur dans une page publique (accueil, inscription, connexion). */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex min-h-dvh bg-beige">
      <ErrorView error={error} retry={retry} />
    </div>
  );
}
