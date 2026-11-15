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

/** Durées proposées, en années (2 saisons par an). Le backend accepte 2 à 12 saisons. */
const HORIZON_YEARS = [1, 2, 3, 5, 6] as const;
const DEFAULT_YEARS = 3;
const HORIZON_KEY = "agr_horizon_years";

function readHorizon(): number {
  try {
    const v = Number(localStorage.getItem(HORIZON_KEY));
    return (HORIZON_YEARS as readonly number[]).includes(v) ? v : DEFAULT_YEARS;
  } catch {
    return DEFAULT_YEARS;
  }
}

/** Choix de la durée du plan de rotation (retour de test du 15/11/2026). */
function HorizonPicker({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (years: number) => void }) {
  const st = useI18n().t.strategies;
  return (
    <fieldset className="card flex flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3.5">
      <legend className="sr-only">{st.horizonLabel}</legend>
      <span aria-hidden className="font-display text-base font-semibold">
        {st.horizonLabel}
      </span>
      <div className="flex flex-wrap gap-2">
        {HORIZON_YEARS.map((y) => (
          <label
            key={y}
            className={
              "inline-flex min-h-11 cursor-pointer items-center rounded-full border-[1.5px] px-4 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-forest " +
              (y === value ? "border-forest bg-forest text-white" : "border-field bg-white text-ink")
            }
          >
            <input type="radio" name="horizon" value={y} checked={y === value} disabled={disabled} onChange={() => onChange(y)} className="sr-only" />
            {fmt(y === 1 ? st.horizonYear : st.horizonYears, { n: y })}
          </label>
        ))}
      </div>
      <span className="text-[13px] text-ink-muted">{st.horizonHint}</span>
    </fieldset>
  );
}

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
  const [years, setYears] = useState(DEFAULT_YEARS);
  const [excluded, setExcluded] = useState<string[]>([]);
  const overrides = useRef<Overrides>({});
  const horizon = useRef(DEFAULT_YEARS * 2);

  const compute = useCallback(
    async (next: Overrides) => {
      setBusy(true);
      setError("");
      try {
        const res = await endpoints.strategies.compute(parcelId, { horizon_seasons: horizon.current, manual_overrides: next });
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
    // Premier calcul au chargement de l'écran, avec la durée choisie la dernière fois (mémorisée sur l'appareil).
    const id = setTimeout(() => {
      const y = readHorizon();
      horizon.current = y * 2;
      setYears(y);
      void compute({});
      endpoints.inputs
        .getPreferences(parcelId)
        .then((p) => setExcluded(p.constraints.excluded_crops))
        .catch(() => undefined);
    }, 0);
    return () => clearTimeout(id);
  }, [compute, parcelId]);

  const changeHorizon = (y: number) => {
    setYears(y);
    horizon.current = y * 2;
    try {
      localStorage.setItem(HORIZON_KEY, String(y));
    } catch {
      /* stockage indisponible : le choix vaut pour cette visite seulement */
    }
    // Les modifications manuelles portent sur des saisons précises : on repart du calcul du moteur.
    void compute({});
  };

  const remote = useMemo<RemoteStrategies | null>(() => {
    if (!data) return null;
    return {
      busy,
      excluded,
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
  }, [data, busy, excluded, compute, parcelId, router, href, t.api.network]);

  const picker = <HorizonPicker value={years} disabled={busy} onChange={changeHorizon} />;

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
      <>
      {picker}
      <div role="status" className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
        <LoaderCircle aria-hidden className="size-9 animate-spin text-forest" />
        <p className="font-semibold">{st.computing}</p>
        <p className="text-sm text-ink-muted">{st.computingHint}</p>
      </div>
      </>
    );
  }

  const computedAt = new Date(data.computed_at).toLocaleString(lang === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <RemoteStrategiesContext.Provider value={remote}>
      {picker}
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
      {data.strategies.find((x) => x.id === "existing")?.name.startsWith("Rotation prévue") && (
        <Banner tone="info" rounded>
          {st.plannedNote}
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
