import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.login.pageTitle };
}

/** Connexion (CU13) : POST /auth/login en phase 3. */
export default async function LoginPage() {
  const { t, href } = await getI18n();
  const l = t.auth.login;
  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[30px] font-bold tracking-[-0.5px]">{l.title}</h1>
      <p className="mb-[26px] text-ink-muted">
        {l.noAccount} <Link href={href("/inscription")}>{l.create}</Link>
      </p>
      <form className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{l.identifier}</span>
          <input className="field-input" autoComplete="username" defaultValue="jean.mbarga@exemple.cm" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{l.password}</span>
          <input className="field-input" type="password" autoComplete="current-password" />
        </label>
        <Link href="#" className="inline-flex min-h-11 items-center self-end text-sm font-semibold">
          {l.forgot}
        </Link>
        <ButtonLink href={href("/tableau-de-bord")} className="min-h-[50px] text-[15px]">
          {l.submit}
        </ButtonLink>
      </form>
    </AuthShell>
  );
}
