"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import * as endpoints from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import type { StrategyId } from "@/lib/api/types";

/** « Retenir cette stratégie » : POST …/strategies/save (rotation mise sous surveillance), puis historique. */
export function RetainButton({ parcelId, computationId, strategyId, label }: { parcelId: string; computationId: string; strategyId: StrategyId; label: string }) {
  const { t, href } = useI18n();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            await endpoints.strategies.save(parcelId, computationId, strategyId);
            router.push(href(`/parcelles/${parcelId}/historique`));
          } catch (err) {
            setError(err instanceof ApiError ? err.message : t.api.network);
            setPending(false);
          }
        }}
      >
        {pending ? t.api.saving : label}
      </Button>
      {error && (
        <p role="alert" className="w-full text-right text-sm text-danger-800">
          {error}
        </p>
      )}
    </>
  );
}
