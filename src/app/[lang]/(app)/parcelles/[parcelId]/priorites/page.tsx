import type { Metadata } from "next";
import { Suspense } from "react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { PageContainer, PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { PrioritiesForm } from "@/components/parcel/PrioritiesForm";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.priorities.pageTitle };
}

export default async function PrioritiesPage({ params }: PageProps<"/[lang]/parcelles/[parcelId]/priorites">) {
  const { t } = await getI18n();
  const pr = t.priorities;
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      <Suspense fallback={<PageSkeleton />}>
        {params.then(({ parcelId }) => (
          <PageContainer>
            <PageHeader eyebrow={pr.eyebrow} title={pr.title} subtitle={pr.subtitle} />
            <PrioritiesForm parcelId={parcelId} />
          </PageContainer>
        ))}
      </Suspense>
    </main>
  );
}
