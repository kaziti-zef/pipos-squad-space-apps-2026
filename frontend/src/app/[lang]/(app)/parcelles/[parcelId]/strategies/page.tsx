import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarRange } from "lucide-react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { PageContainer, PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { StrategiesView } from "@/components/strategy/StrategiesView";
import { MobileStrategies } from "@/components/strategy/MobileStrategies";
import { getI18n } from "@/i18n/server";
import { getStrategies } from "@/lib/mocks/localized";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.strategies.pageTitle };
}

export default async function StrategiesPage({ params }: PageProps<"/[lang]/parcelles/[parcelId]/strategies">) {
  const { t, lang } = await getI18n();
  const st = t.strategies;
  const data = getStrategies(lang);
  return (
    <main className="flex-1">
      <DisclaimerBanner variant="strategies" />
      <Suspense fallback={<PageSkeleton width="wide" />}>
        {params.then(({ parcelId }) => (
          <PageContainer width="wide">
            <PageHeader
              eyebrow={st.eyebrow}
              title={st.title}
              actions={
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <span className="size-2 rounded-full bg-leaf" />
                  {st.liveData}
                </p>
              }
            />
            <section className="flex gap-3 rounded-2xl bg-rain-season/60 p-4 md:p-5">
              <CalendarRange aria-hidden className="mt-0.5 size-6 shrink-0 text-forest" />
              <div>
                <h2 className="font-display text-base font-semibold text-forest">{st.seasonsTitle}</h2>
                <p className="mt-1 max-w-[860px] text-sm leading-[1.55] text-ink-soft">{st.seasonsText}</p>
              </div>
            </section>
            <div className="hidden md:contents">
              <StrategiesView data={data} parcelId={parcelId} />
            </div>
            <div className="md:hidden">
              <MobileStrategies data={data} parcelId={parcelId} />
            </div>
            <p className="text-sm leading-[1.5] text-ink-muted">{st.footnote}</p>
          </PageContainer>
        ))}
      </Suspense>
    </main>
  );
}
