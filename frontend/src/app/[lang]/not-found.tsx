import { BrandMark } from "@/components/layout/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";

/** Page introuvable (404), dans la langue courante. */
export default async function NotFound() {
  const { t, href } = await getI18n();
  const e = t.errors;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-beige px-4 py-16">
      <div className="card flex max-w-[480px] flex-col items-center gap-4 p-8 text-center">
        <BrandMark size={56} />
        <h1 className="font-display text-2xl font-bold">{e.notFoundTitle}</h1>
        <p className="text-base leading-[1.55] text-ink-soft">{e.notFoundText}</p>
        <ButtonLink href={href("/")} className="mt-2">
          {e.notFoundCta}
        </ButtonLink>
      </div>
    </main>
  );
}
