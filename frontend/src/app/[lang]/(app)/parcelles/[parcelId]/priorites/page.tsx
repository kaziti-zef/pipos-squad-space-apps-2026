import type { Metadata } from "next";
import { Suspense } from "react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { PageContainer, PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ParcelEyebrow } from "@/components/layout/ParcelEyebrow";
import { PrioritiesForm } from "@/components/parcel/PrioritiesForm";
import { getI18n } from "@/i18n/server";
import { loadInputs } from "@/lib/data/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.priorities.pageTitle };
}

export default async function PrioritiesPage({ params }: PageProps<"/[lang]/parcelles/[parcelId]/priorites">) {
  const { t, lang } = await getI18n();
  const pr = t.priorities;
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      <Suspense fallback={<PageSkeleton />}>
        {params.then(async ({ parcelId }) => {
          const { preferences } = await loadInputs(parcelId, lang);
          return (
            <PageContainer>
              <PageHeader
                eyebrow={<ParcelEyebrow params={params} template={pr.eyebrowParcel} demo={pr.eyebrow} />}
                title={pr.title} subtitle={pr.subtitle} />
              <PrioritiesForm parcelId={parcelId} initial={preferences} />
            </PageContainer>
          );
        })}
      </Suspense>
    </main>
  );
}
