import type { Metadata } from "next";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { PageContainer } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { HistoryTimeline } from "@/components/history/HistoryTimeline";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { API_ENABLED, loadInputs, loadParcel, loadSavedList } from "@/lib/data/server";
import type { HistoryEntry } from "@/lib/mocks/history";
import { getHistory } from "@/lib/mocks/localized";

const date = (iso: string, lang: Locale) => new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR");

/**
 * Backend : stratégies sauvegardées (GET …/strategies/saved + détail, avec notes) puis saisons passées
 * (GET …/history). Démo : historique fixe.
 */
async function loadEntries(parcelId: string, lang: Locale): Promise<HistoryEntry[]> {
  if (!API_ENABLED) return getHistory(lang);
  const [saved, inputs] = await Promise.all([loadSavedList(parcelId, lang), loadInputs(parcelId, lang)]);
  const strategies: HistoryEntry[] = saved
    .sort((a, b) => b.saved_at.localeCompare(a.saved_at))
    .map((x) => ({
      kind: "strategy",
      id: x.saved_id,
      saved_id: x.saved_id,
      computation_id: x.computation_id,
      saved_at: date(x.saved_at, lang),
      saved_by: x.saved_by,
      strategy_id: x.id,
      name: x.name,
      score: x.score,
      confidence: x.confidence.level,
      sequence: x.sequence.map((e) => e.crop_id),
      sequence_names: x.sequence.map((e) => e.crop_name),
      outdated_geometry: x.outdated_geometry,
      notes: x.notes.map((n) => ({
        author: n.author.full_name,
        role: n.author.role,
        kind: n.kind,
        text: n.text,
        created_at: date(n.created_at, lang),
      })),
    }));
  const seasons: HistoryEntry[] = [...(inputs.history?.seasons ?? [])]
    .sort((a, b) => b.season_index - a.season_index)
    .map((x) => ({
      kind: "season",
      id: `season${x.season_index}`,
      seasons: x.label ?? String(x.season_index),
      crop_ids: [x.crop_id],
      notes: [],
    }));
  return [...strategies, ...seasons];
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.history.pageTitle };
}

export default async function HistoryPage({ params }: PageProps<"/[lang]/parcelles/[parcelId]/historique">) {
  const { t, lang } = await getI18n();
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      <Suspense fallback={<PageSkeleton width="narrow" />}>
        {params.then(async ({ parcelId }) => {
          const [entries, parcelName] = await Promise.all([
            loadEntries(parcelId, lang),
            API_ENABLED ? loadParcel(parcelId, lang).then((p) => p.name) : Promise.resolve(undefined),
          ]);
          const retained = entries.find((e) => e.kind === "strategy");
          return (
          <PageContainer width="narrow" className="gap-5">
            {retained && (
              <div role="status" className="flex items-center gap-2.5 rounded-xl bg-forest px-[18px] py-3.5 text-white">
                <Check aria-hidden className="size-5 shrink-0 text-leaf-300" strokeWidth={2.4} />
                {fmt(t.history.retained, { name: retained.name, date: retained.saved_at })}
              </div>
            )}
            <HistoryTimeline entries={entries} parcelId={parcelId} parcelName={parcelName} />
          </PageContainer>
          );
        })}
      </Suspense>
    </main>
  );
}
