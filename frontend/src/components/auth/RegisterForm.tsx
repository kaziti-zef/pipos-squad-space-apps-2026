"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";
import { useApiMode } from "@/lib/api/app-context";
import * as endpoints from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <em id={id} className="flex items-center gap-1.5 text-sm not-italic text-danger-600">
      <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      {children}
    </em>
  );
}

/** Inscription en 2 étapes (CU1) : POST /auth/register puis POST /farms (via le BFF). En démo : navigation seule. */
export function RegisterForm() {
  const router = useRouter();
  const { t, href } = useI18n();
  const r = t.auth.register;
  const [step, setStep] = useState<1 | 2>(1);
  const apiEnabled = useApiMode();
  const [fullName, setFullName] = useState(apiEnabled ? "" : "Jean Mbarga");
  const [identifier, setIdentifier] = useState(apiEnabled ? "" : "jean.mbarga@exemple.cm");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const tooShort = password.length < 8;
  const missing = !fullName.trim() || !identifier.trim();

  const next = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!tooShort && !missing) setStep(2);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!apiEnabled) return router.push(href("/tableau-de-bord"));
    const farmName = String(new FormData(e.currentTarget).get("farm")).trim() || t.common.farmName;
    setPending(true);
    setError("");
    try {
      await endpoints.auth.register({ full_name: fullName.trim(), identifier: identifier.trim(), password });
      await endpoints.farms.create(farmName, "cm_yaounde");
      router.push(href("/tableau-de-bord"));
      router.refresh();
    } catch (err) {
      // Erreur sur le compte (identifiant déjà pris…) : retour à l'étape 1 avec le message du serveur.
      if (err instanceof ApiError && err.status !== 503 && !err.isNetwork && err.code !== "DEMO_MODE") setStep(1);
      setError(err instanceof ApiError ? err.message : t.api.network);
      setPending(false);
    }
  };

  const errorBox = error && (
    <p role="alert" className="rounded-md bg-danger-100 px-3.5 py-3 text-sm text-danger-800">
      {error}
    </p>
  );

  return (
    <>
      <div className="mb-7 flex gap-2" aria-label={t.auth.progress}>
        {t.auth.steps.map((label, i) => (
          <div key={label} className="flex-1">
            <div className={cn("h-1.5 rounded-md", i < step ? "bg-leaf" : "bg-line")} />
            <p className={cn("mt-2 text-sm font-semibold", i < step ? "text-forest" : "text-ink-muted")}>{label}</p>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={next} noValidate>
          <h1 className="mb-1.5 font-display text-[30px] font-bold tracking-[-0.5px]">{r.title}</h1>
          <p className="mb-[26px] text-ink-muted">
            {r.already} <Link href={href("/connexion")}>{r.login}</Link>
          </p>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">{r.fullName}</span>
              <input
                className={cn("field-input", touched && !fullName.trim() && "border-danger-600")}
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">{r.identifier}</span>
              <input
                className={cn("field-input", touched && !identifier.trim() && "border-danger-600")}
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">{r.password}</span>
              <input
                className={cn("field-input", touched && tooShort && "border-danger-600")}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={touched && tooShort}
                aria-describedby={touched && tooShort ? "pwd-err" : undefined}
              />
              {touched && tooShort && <FieldError id="pwd-err">{r.passwordShort}</FieldError>}
            </label>
            {errorBox}
            <Button type="submit" className="mt-1.5 min-h-[50px] text-[15px]">
              {r.continue}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={submit}>
          <h1 className="mb-1.5 font-display text-[30px] font-bold tracking-[-0.5px]">{r.farmTitle}</h1>
          <p className="mb-[26px] text-ink-muted">{r.farmSubtitle}</p>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">{r.farmName}</span>
              <input name="farm" className="field-input" required defaultValue={apiEnabled ? "" : t.common.farmName} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">{r.country}</span>
              <select className="field-input">
                <option>{r.countryCm}</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">{r.region}</span>
              <select className="field-input">
                <option value="cm_yaounde">{t.common.region}</option>
              </select>
              <em className="text-sm not-italic text-ink-muted">{r.regionHelp}</em>
            </label>
            {errorBox}
            <div className="mt-1.5 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="min-h-[50px]">
                {r.back}
              </Button>
              <Button type="submit" disabled={pending} className="min-h-[50px] flex-1 text-[15px]">
                {pending ? t.api.pending : r.create}
              </Button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
