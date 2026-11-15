"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useState, type ComponentProps, type ReactNode } from "react";

function MapSkeleton() {
  return <div className="h-full min-h-[420px] w-full animate-pulse bg-[#56733f]" aria-hidden />;
}

/**
 * Ne monte la carte que lorsque la page est visible, et la recrée à chaque réapparition.
 *
 * Avec Cache Components, Next.js masque les pages quittées avec <Activity> au lieu de les démonter
 * (et peut prérendre la page suivante masquée). Masquer une page exécute les cleanups d'effets :
 * react-leaflet 5 détruit alors la carte (map.remove()) mais garde sa référence, et la réutilise
 * quand la page réapparaît (« Map container is being reused », « reading 'appendChild' »).
 * Même problème avec le double montage du Strict Mode en dev.
 * Démonter le sous-arbre quand la page est masquée garantit une carte neuve à chaque affichage.
 */
function WhenVisible({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  useLayoutEffect(() => {
    // Schéma recommandé par Next (guide « Preserving UI state ») : état réinitialisé dans le cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    return () => setVisible(false);
  }, []);
  return visible ? children : <MapSkeleton />;
}

/** Leaflet manipule window : chargement côté client uniquement. */
const FarmMapClient = dynamic(() => import("./FarmMap"), { ssr: false, loading: MapSkeleton });
const ParcelDrawMapClient = dynamic(() => import("./ParcelDrawMap"), { ssr: false, loading: MapSkeleton });

export function FarmMap(props: ComponentProps<typeof FarmMapClient>) {
  return (
    <WhenVisible>
      <FarmMapClient {...props} />
    </WhenVisible>
  );
}

export function ParcelDrawMap(props: ComponentProps<typeof ParcelDrawMapClient>) {
  return (
    <WhenVisible>
      <ParcelDrawMapClient {...props} />
    </WhenVisible>
  );
}
