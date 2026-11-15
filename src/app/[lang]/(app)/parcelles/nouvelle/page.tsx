import type { Metadata } from "next";
import { ParcelEditor } from "@/components/parcel/ParcelEditor";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.parcelNew.pageTitle };
}

export default function NewParcelPage() {
  return <ParcelEditor />;
}
