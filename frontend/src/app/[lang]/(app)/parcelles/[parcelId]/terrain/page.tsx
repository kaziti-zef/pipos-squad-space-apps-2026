import type { Metadata } from "next";
import { Suspense } from "react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { PageContainer, PageHeader } from "@/components/layout/PageHeader";
import { ParcelEyebrow } from "@/components/layout/ParcelEyebrow";
import { TerrainForm } from "@/components/parcel/TerrainForm";
import { getI18n } from "@/i18n/server";
import { API_ENABLED, loadInputs, loadRole } from "@/lib/data/server";

type Props = PageProps<"/[lang]/parcelles/[parcelId]/terrain">;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.terrain.pageTitle };
}

/**
 * Saisies existantes (GET local-inputs et history) et rôle sur la ferme : un conseiller voit le formulaire
 * en lecture seule. En démo, `?role=advisor` montre cette vue.
 */
async function Form({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { lang } = await getI18n();
  const [{ parcelId }, query] = await Promise.all([params, searchParams]);
  const [inputs, role] = await Promise.all([loadInputs(parcelId, lang), loadRole(parcelId, lang)]);
  const readOnly = API_ENABLED ? role === "advisor" : query.role === "advisor";
  return <TerrainForm parcelId={parcelId} readOnly={readOnly} initial={{ local: inputs.local, history: inputs.history }} />;
}

export default async function TerrainPage({ params, searchParams }: Props) {
  const { t } = await getI18n();
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      <PageContainer>
        <PageHeader
          eyebrow={
            <Suspense fallback="…">
              <ParcelEyebrow params={params} template={t.terrain.eyebrowParcel} demo={t.terrain.eyebrow} />
            </Suspense>
          }
          title={t.terrain.title} subtitle={t.terrain.subtitle} />
        <Suspense fallback={<div className="card h-[800px] animate-pulse" />}>
          <Form params={params} searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </main>
  );
}
