import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.auth.login.pageTitle };
}

/** Connexion (CU13). Le formulaire lit ?next= : il est rendu dans un Suspense. */
export default async function LoginPage() {
  const { t, href } = await getI18n();
  const l = t.auth.login;
  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[30px] font-bold tracking-[-0.5px]">{l.title}</h1>
      <p className="mb-[26px] text-ink-muted">
        {l.noAccount} <Link href={href("/inscription")}>{l.create}</Link>
      </p>
      <Suspense fallback={<div className="h-[260px]" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
