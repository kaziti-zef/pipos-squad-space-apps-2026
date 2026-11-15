import type { Metadata } from "next";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { PageContainer } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { HistoryTimeline } from "@/components/history/HistoryTimeline";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { getHistory } from "@/lib/mocks/localized";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.history.pageTitle };
}

export default async function HistoryPage({ params }: PageProps<"/[lang]/parcelles/[parcelId]/historique">) {
  const { t, lang } = await getI18n();
  const entries = getHistory(lang);
  const retained = entries.find((e) => e.kind === "strategy");
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      <Suspense fallback={<PageSkeleton width="narrow" />}>
        {params.then(({ parcelId }) => (
          <PageContainer width="narrow" className="gap-5">
            {retained && (
              <div role="status" className="flex items-center gap-2.5 rounded-xl bg-forest px-[18px] py-3.5 text-white">
                <Check aria-hidden className="size-5 shrink-0 text-leaf-300" strokeWidth={2.4} />
                {fmt(t.history.retained, { name: retained.name, date: retained.saved_at })}
              </div>
            )}
            <HistoryTimeline entries={entries} parcelId={parcelId} />
          </PageContainer>
        ))}
      </Suspense>
    </main>
  );
}
