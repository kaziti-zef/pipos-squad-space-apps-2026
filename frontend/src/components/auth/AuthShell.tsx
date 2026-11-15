import Image from "next/image";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/Logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { getI18n } from "@/i18n/server";

/** Mise en page partagée inscription / connexion : photo à gauche, formulaire à droite. */
export async function AuthShell({ children }: { children: ReactNode }) {
  const { t, href } = await getI18n();
  return (
    <main className="flex min-h-dvh flex-wrap bg-beige text-ink">
      <div className="relative box-border flex min-h-[420px] flex-[1_1_480px] flex-col justify-between overflow-hidden p-10 text-white">
        <Image
          src="/images/farmers/mais.jpg"
          alt={t.auth.imageAlt}
          fill
          priority
          sizes="(min-width: 1000px) 50vw, 100vw"
          className="object-cover object-[70%_center]"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(9,36,20,.55), rgba(9,36,20,.15) 40%, rgba(9,36,20,.85))" }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <Logo href={href("/")} size="lg" />
          <LanguageSwitcher />
        </div>
        <div className="relative max-w-[440px]">
          <p className="mb-2.5 font-display text-[30px] font-semibold leading-[1.2]">{t.auth.quote}</p>
          <p className="text-[#d6e8dc]">{t.auth.quoteSub}</p>
        </div>
      </div>
      <div className="box-border flex flex-[1_1_520px] items-center justify-center px-6 py-12">
        <div className="w-full max-w-[460px]">{children}</div>
      </div>
    </main>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
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
