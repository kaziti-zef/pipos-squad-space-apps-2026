import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Droplet, Map as MapIcon, Plus } from "lucide-react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { ButtonLink } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Indicators";
import { PageContainer, PageHeader } from "@/components/layout/PageHeader";
import { FarmMap } from "@/components/map";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { API_ENABLED, loadParcels, loadSession } from "@/lib/data/server";
import { cn, fr } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.dashboard.pageTitle };
}

function Kpi({ label, children, warn }: { label: string; children: React.ReactNode; warn?: boolean }) {
  return (
    <div className={cn("card p-5", warn && "bg-warn-50")}>
      <p className={cn("text-sm font-medium", warn ? "text-warn-800" : "text-ink-muted")}>{label}</p>
      <p className={cn("mt-1.5 font-display text-[28px] font-bold", warn && "text-warn-700")}>{children}</p>
    </div>
  );
}

function CompletenessChip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <Chip className={ok ? "bg-leaf-100 text-forest" : "bg-sand-200 text-ink-muted line-through"}>{children}</Chip>;
}

export default function DashboardPage() {
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      {/* Session et parcelles lues sur le serveur (cookies) : contenu dynamique, rendu dans un Suspense. */}
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}

async function Dashboard() {
  const { t, lang, href } = await getI18n();
  const d = t.dashboard;
  const session = await loadSession(lang);
  const parcels = await loadParcels(lang, session.farm?.id ?? null);
  const total = parcels.reduce((s, p) => s + p.area_ha, 0);
  const firstName = session.user.full_name.split(" ")[0];
  const ready = parcels.filter((p) => p.data_completeness.local_inputs && p.data_completeness.history).length;
  const chosen = parcels.filter((p) => p.last_saved_strategy).length;

  return (
      <PageContainer className="gap-6 pt-8">
        <PageHeader
          title={<span className="md:text-[32px]">{fmt(d.hello, { name: firstName })}</span>}
          subtitle={API_ENABLED && session.farm ? fmt(d.subtitleFarm, { farm: session.farm.name, n: session.farm.members_count }) : d.subtitle}
          actions={
            <ButtonLink href={href("/parcelles/nouvelle")} className="min-h-11">
              <Plus aria-hidden className="size-[18px]" strokeWidth={2.2} /> {d.newParcel}
            </ButtonLink>
          }
        />

        {parcels.length === 0 ? (
          /* État vide (CU3-A1) : visible tant qu'aucune parcelle n'est enregistrée. */
          <div className="card flex flex-col items-center gap-3.5 px-8 py-14 text-center">
            <div className="flex size-[88px] items-center justify-center rounded-full bg-leaf-100">
              <MapIcon aria-hidden className="size-11 text-forest-700" strokeWidth={1.8} />
            </div>
            <h2 className="font-display text-2xl font-semibold">{d.emptyTitle}</h2>
            <p className="max-w-[440px] leading-[1.55] text-ink-muted">{d.emptyText}</p>
            <ButtonLink href={href("/parcelles/nouvelle")} variant="cta" className="mt-1.5 min-h-[50px]">
              {d.emptyCta}
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              <Kpi label={d.kpiParcels}>{parcels.length}</Kpi>
              <Kpi label={d.kpiArea}>
                {fr(total, 1, lang)} <span className="text-base text-ink-muted">ha</span>
              </Kpi>
              {API_ENABLED ? (
                <>
                  <Kpi label={d.kpiReady}>
                    {ready} <span className="text-base text-ink-muted">/ {parcels.length}</span>
                  </Kpi>
                  <Kpi label={d.kpiChosen}>{chosen}</Kpi>
                </>
              ) : (
                <>
                  <Kpi label={d.kpiConfidence}>
                    <span className="text-warn-700">{d.kpiConfidenceValue}</span>
                  </Kpi>
                  <Kpi label={d.kpiAlerts} warn>
                    1 <span className="text-[15px] font-semibold">{d.kpiAlertsValue}</span>
                  </Kpi>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-5">
              <div className="card flex min-w-0 flex-[3_1_520px] flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-[18px]">
                  <h2 className="font-display text-lg font-semibold">{d.mapTitle}</h2>
                  <Chip className="bg-sand-200 text-ink-soft">{d.satellite}</Chip>
                </div>
                {/* La carte remplit toute la hauteur de la carte-conteneur (plus de vide sous la carte, audit B3). */}
                <div className="relative isolate min-h-[420px] flex-1">
                  <div className="absolute inset-0">
                    <FarmMap parcels={parcels} ariaLabel={d.mapAria} />
                  </div>
                </div>
              </div>

              <div className="flex flex-[2_1_340px] flex-col gap-3.5">
                {!API_ENABLED && (
                <div className="card flex gap-3 border border-warn-200 bg-warn-50 px-[18px] py-4">
                  <Droplet aria-hidden className="size-[22px] shrink-0 text-warn-600" />
                  <div>
                    <p className="font-semibold text-warn-800">{d.alertTitle}</p>
                    <p className="mb-2 mt-1 text-sm text-warn-800">{d.alertText}</p>
                    <Link href={href("/parcelles/pcl_55/diagnostic")} className="inline-flex min-h-11 items-center text-sm font-semibold text-warn-800">
                      {d.alertCta}
                    </Link>
                  </div>
                </div>
                )}

                {parcels.map((p) => {
                  const saved = p.last_saved_strategy;
                  // Saisies incomplètes -> terrain ; rotation déjà choisie -> historique ; sinon -> stratégies.
                  const cta = !p.data_completeness.local_inputs || !p.data_completeness.history
                    ? { href: `/parcelles/${p.id}/diagnostic`, label: d.ctaComplete }
                    : saved
                      ? { href: `/parcelles/${p.id}/historique`, label: d.ctaHistory }
                      : { href: `/parcelles/${p.id}/strategies`, label: d.ctaStrategies };
                  return (
                    <div key={p.id} className="card flex flex-col gap-2.5 px-[18px] py-4">
                      <div className="flex items-start justify-between gap-2.5">
                        <div>
                          <p className="font-display text-base font-semibold">{p.name}</p>
                          <p className="mt-0.5 text-sm text-ink-muted">
                            {fr(p.area_ha, 2, lang)} ha{p.current_crop ? ` · ${p.current_crop}` : ""}
                            {p.note ? ` · ${p.note}` : ""}
                          </p>
                        </div>
                        {saved ? (
                          <Chip className={cn("shrink-0 whitespace-nowrap", saved.score >= 80 ? "bg-forest text-white" : "bg-leaf-100 text-forest")}>
                            {fmt(d.score, { score: fr(saved.score, 1, lang) })}
                          </Chip>
                        ) : (
                          <Chip className="shrink-0 whitespace-nowrap bg-warn-100 text-warn-800">{d.toComplete}</Chip>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <CompletenessChip ok={p.data_completeness.local_inputs}>{d.completeness.local}</CompletenessChip>
                        <CompletenessChip ok={p.data_completeness.history}>{d.completeness.history}</CompletenessChip>
                        <CompletenessChip ok={p.data_completeness.preferences}>{d.completeness.prefs}</CompletenessChip>
                      </div>
                      <ButtonLink href={href(cta.href)} variant="secondary" className="min-h-10 self-start">
                        {cta.label}
                      </ButtonLink>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </PageContainer>
  );
}
