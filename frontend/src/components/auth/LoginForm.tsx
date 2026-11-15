"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { useApiMode } from "@/lib/api/app-context";
import * as endpoints from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";

/** Connexion (CU13) : POST /auth/login via le BFF (jetons posés en cookies httpOnly). En démo : accès direct. */
export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const apiEnabled = useApiMode();
  const { t, href } = useI18n();
  const l = t.auth.login;
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = search.get("next");
    const target = next?.startsWith("/") && !next.startsWith("//") ? next : href("/tableau-de-bord");
    if (!apiEnabled) return router.push(target);
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      await endpoints.auth.login({ identifier: String(data.get("identifier")).trim(), password: String(data.get("password")) });
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t.api.network);
      setPending(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{l.identifier}</span>
        <input name="identifier" className="field-input" autoComplete="username" required defaultValue={apiEnabled ? "" : "jean.mbarga@exemple.cm"} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{l.password}</span>
        <input name="password" className="field-input" type="password" autoComplete="current-password" required />
      </label>
      {error && (
        <p role="alert" className="rounded-md bg-danger-100 px-3.5 py-3 text-sm text-danger-800">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="min-h-[50px] text-[15px]">
        {pending ? t.api.pending : l.submit}
      </Button>
    </form>
  );
}
