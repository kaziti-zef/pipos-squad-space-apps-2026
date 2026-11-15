"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react";
import { Banner } from "@/components/ui/Banner";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/config";
import * as endpoints from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { StrategiesResponse as ApiStrategies } from "@/lib/api/types";
import type { StrategiesResponse, StrategyType } from "@/lib/types";
import { MobileStrategies } from "./MobileStrategies";
import { RemoteStrategiesContext, type RemoteStrategies } from "./remote";
import { StrategiesView } from "./StrategiesView";

type Overrides = Partial<Record<StrategyType, Record<string, string>>>;

/** Nombre de saisons calculées (2027-S1 à 2029-S2), comme la maquette. */
const HORIZON = 6;

/**
 * Comparaison des stratégies branchée sur le backend :
 * POST /parcels/{id}/strategies au chargement, puis à chaque culture modifiée (manual_overrides).
 * « Retenir » sauvegarde le calcul affiché (POST …/strategies/save) et le place sous surveillance.
 */
export function StrategiesLoader({ parcelId }: { parcelId: string }) {
  const { t, lang, href } = useI18n();
  const router = useRouter();
  const st = t.strategies;
  const [data, setData] = useState<ApiStrategies | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const overrides = useRef<Overrides>({});

  const compute = useCallback(
    async (next: Overrides) => {
      setBusy(true);
      setError("");
      try {
        const res = await endpoints.strategies.compute(parcelId, { horizon_seasons: HORIZON, manual_overrides: next });
        overrides.current = next;
        setData(res);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return router.push(href("/connexion"));
        setError(err instanceof ApiError ? err.message : t.api.network);
      } finally {
        setBusy(false);
      }
    },
    [parcelId, router, href, t.api.network],
  );

  useEffect(() => {
    // Premier calcul au chargement de l'écran (état mis à jour après la réponse du serveur).
    const id = setTimeout(() => void compute({}), 0);
    return () => clearTimeout(id);
  }, [compute]);

  const remote = useMemo<RemoteStrategies | null>(() => {
    if (!data) return null;
    return {
      busy,
      setCrop: (id, season, crop) => {
        const cur = overrides.current;
        void compute({ ...cur, [id]: { ...(cur[id] ?? {}), [String(season + 1)]: crop } });
      },
      undo: (id) => {
        const next = { ...overrides.current };
        delete next[id];
        void compute(next);
      },
      retain: (id) => {
        setBusy(true);
        endpoints.strategies
          .save(parcelId, data.computation_id, id)
          .then(() => router.push(href(`/parcelles/${parcelId}/historique`)))
          .catch((err) => {
            setError(err instanceof ApiError ? err.message : t.api.network);
            setBusy(false);
          });
      },
      detailHref: (id) => `/parcelles/${parcelId}/strategies/${id}?c=${data.computation_id}`,
    };
  }, [data, busy, compute, parcelId, router, href, t.api.network]);

  if (!data) {
    return error ? (
      <div role="alert" className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
        <TriangleAlert aria-hidden className="size-9 text-warn-600" />
        <p className="max-w-[460px] text-ink-soft">{error}</p>
        <Button onClick={() => void compute(overrides.current)}>
          <RotateCcw aria-hidden className="size-4" /> {t.api.retry}
        </Button>
      </div>
    ) : (
      <div role="status" className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <LoaderCircle aria-hidden className="size-9 animate-spin text-forest" />
        <p className="font-semibold">{st.computing}</p>
        <p className="text-sm text-ink-muted">{st.computingHint}</p>
      </div>
    );
  }

  const computedAt = new Date(data.computed_at).toLocaleString(lang === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <RemoteStrategiesContext.Provider value={remote}>
      <p className="flex items-center gap-2 text-sm text-ink-muted" aria-live="polite">
        {busy ? (
          <>
            <LoaderCircle aria-hidden className="size-4 animate-spin text-forest" /> {st.recomputing}
          </>
        ) : (
          <>
            <span className="size-2 rounded-full bg-leaf" /> {fmt(st.computedAt, { date: computedAt })}
          </>
        )}
      </p>
      {data.data_source_status !== "live" && (
        <Banner tone="info" rounded>
          {t.diagnostic.cacheText}
        </Banner>
      )}
      {data.warnings.map((w) => (
        <Banner key={w.code} tone="warn" rounded>
          {w.message}
        </Banner>
      ))}
      {error && (
        <Banner tone="danger" rounded>
          {error}
        </Banner>
      )}
      <div className={busy ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
        {/* Les types de réponse de l'API sont un sur-ensemble de ceux des vues (champs ajoutés au contrat). */}
        <div className="hidden md:contents">
          <StrategiesView data={data as unknown as StrategiesResponse} parcelId={parcelId} />
        </div>
        <div className="md:hidden">
          <MobileStrategies data={data as unknown as StrategiesResponse} parcelId={parcelId} />
        </div>
      </div>
    </RemoteStrategiesContext.Provider>
  );
}
