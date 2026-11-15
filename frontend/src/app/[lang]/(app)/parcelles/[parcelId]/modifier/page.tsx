import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ParcelEditor } from "@/components/parcel/ParcelEditor";
import { getI18n } from "@/i18n/server";
import { loadParcel, loadRole } from "@/lib/data/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.parcelNew.editTitle };
}

/** Modification d'une parcelle : nom, contour (PATCH) et suppression (agriculteur principal). */
async function Editor({ params }: { params: PageProps<"/[lang]/parcelles/[parcelId]/modifier">["params"] }) {
  const { lang } = await getI18n();
  const { parcelId } = await params;
  const [parcel, role] = await Promise.all([loadParcel(parcelId, lang), loadRole(parcelId, lang)]);
  const ring = parcel.geometry.coordinates[0] as [number, number][];
  return (
    <ParcelEditor
      parcel={{
        id: parcel.id,
        name: parcel.name,
        version: parcel.version,
        outline: ring.slice(0, -1),
        elevation_m: parcel.srtm?.elevation_m ?? null,
        slope_deg: parcel.srtm?.slope_deg ?? null,
      }}
      canDelete={role === "owner"}
    />
  );
}

export default function EditParcelPage({ params }: PageProps<"/[lang]/parcelles/[parcelId]/modifier">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Editor params={params} />
    </Suspense>
  );
}
