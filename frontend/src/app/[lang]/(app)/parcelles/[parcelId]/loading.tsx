import { PageSkeleton } from "@/components/layout/PageSkeleton";

/**
 * Écran de chargement immédiat des pages d'une parcelle : la navigation (après un enregistrement par exemple)
 * s'affiche tout de suite au lieu de laisser le bouton sur « Enregistrement… » pendant que le serveur répond.
 */
export default function Loading() {
  return (
    <main className="flex-1" aria-busy="true">
      <PageSkeleton />
    </main>
  );
}
