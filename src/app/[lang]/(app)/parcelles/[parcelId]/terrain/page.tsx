import type { Metadata } from "next";
import { Suspense } from "react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { PageContainer, PageHeader } from "@/components/layout/PageHeader";
import { TerrainForm } from "@/components/parcel/TerrainForm";
import { getI18n } from "@/i18n/server";

type Props = PageProps<"/[lang]/parcelles/[parcelId]/terrain">;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.terrain.pageTitle };
}

/** `?role=advisor` affiche la vue lecture seule du conseiller (en attendant GET /farms/{id}). */
async function Form({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ parcelId }, query] = await Promise.all([params, searchParams]);
  return <TerrainForm parcelId={parcelId} readOnly={query.role === "advisor"} />;
}

export default async function TerrainPage({ params, searchParams }: Props) {
  const { t } = await getI18n();
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      <PageContainer>
        <PageHeader eyebrow={t.terrain.eyebrow} title={t.terrain.title} subtitle={t.terrain.subtitle} />
        <Suspense fallback={<div className="card h-[800px] animate-pulse" />}>
          <Form params={params} searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </main>
  );
}
