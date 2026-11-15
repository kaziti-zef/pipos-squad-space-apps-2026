import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { API_ENABLED, loadParcel } from "@/lib/data/server";
import { fr } from "@/lib/utils";

/**
 * Sur-titre d'un écran de parcelle : texte de démonstration, ou nom et surface réels de la parcelle.
 * `template` reçoit {name} et {area}. À rendre dans un <Suspense> (lecture de la parcelle).
 */
export async function ParcelEyebrow({ params, template, demo }: { params: Promise<{ parcelId: string }>; template: string; demo: string }) {
  if (!API_ENABLED) return <>{demo}</>;
  const { lang } = await getI18n();
  const { parcelId } = await params;
  const parcel = await loadParcel(parcelId, lang);
  return <>{fmt(template, { name: parcel.name, area: fr(parcel.area_ha, 2, lang) })}</>;
}
