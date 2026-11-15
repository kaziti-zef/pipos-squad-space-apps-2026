import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Banner, DisclaimerBanner } from "@/components/ui/Banner";
import { ButtonLink } from "@/components/ui/Button";
import { PageContainer, PageHeader } from "@/components/layout/PageHeader";
import { ClimateDiagnostic } from "@/components/charts/ClimateDiagnostic";
import { getI18n } from "@/i18n/server";
import { getClimate } from "@/lib/mocks/localized";
import type { DataSourceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.diagnostic.pageTitle };
}

/** Bandeau du plan B (contrat §3.6). `?source=fallback_cache|fallback_local` pour la démo. */
async function SourceBanner({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { t } = await getI18n();
  const d = t.diagnostic;
  const status = ((await searchParams).source as DataSourceStatus | undefined) ?? "live";
  if (status === "fallback_cache")
    return (
      <Banner tone="info">
        <strong>{d.cacheStrong}</strong> {d.cacheText}
      </Banner>
    );
  if (status === "fallback_local")
    return (
      <Banner tone="warn">
        <strong>{d.localStrong}</strong> {d.localText}
      </Banner>
    );
  return null;
}

const SEASON_SPANS = [
  { span: 2, dry: true },
  { span: 4, dry: false },
  { span: 2, dry: true },
  { span: 3, dry: false },
  { span: 1, dry: true },
];

export default async function DiagnosticPage({ params, searchParams }: PageProps<"/[lang]/parcelles/[parcelId]/diagnostic">) {
  const { t, lang, href } = await getI18n();
  const d = t.diagnostic;
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      <Suspense fallback={null}>
        <SourceBanner searchParams={searchParams} />
      </Suspense>
      <PageContainer>
        <PageHeader
          eyebrow={
            <>
              <Link href={href("/tableau-de-bord")} className="inline-flex min-h-11 items-center no-underline">
                {d.breadcrumb}
              </Link>{" "}
              / {t.common.plotName}
            </>
          }
          title={d.title}
          subtitle={d.subtitle}
          actions={
            <Suspense fallback={null}>
              {params.then(({ parcelId }) => (
                <ButtonLink href={href(`/parcelles/${parcelId}/terrain`)} className="w-full py-2.5 text-center sm:w-auto">
                  {d.cta}
                </ButtonLink>
              ))}
            </Suspense>
          }
        />

        <div className="card px-5 py-[18px]">
          <p className="mb-3 text-sm font-semibold">{d.calendarTitle}</p>
          {/* Mobile : liste « période — saison » (12 colonnes ne tiennent pas dans 300 px). */}
          <ol className="flex flex-col gap-1.5 sm:hidden">
            {SEASON_SPANS.map((s, i) => {
              const start = SEASON_SPANS.slice(0, i).reduce((n, x) => n + x.span, 0);
              const end = start + s.span - 1;
              const period = start === end ? t.months[start] : `${t.months[start]} – ${t.months[end]}`;
              return (
                <li
                  key={i}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold",
                    s.dry ? "bg-dry-season text-dry-season-ink" : "bg-rain-season text-forest",
                  )}
                >
                  <span className="w-[132px] shrink-0 font-normal">{period}</span>
                  {d.seasons[i]}
                </li>
              );
            })}
          </ol>
          <div className="hidden grid-cols-12 gap-[3px] text-center text-[13px] font-semibold sm:grid">
            {SEASON_SPANS.map((s, i) => (
              <div
                key={i}
                style={{ gridColumn: `span ${s.span}` }}
                className={cn("rounded-xs px-0.5 py-2", s.dry ? "bg-dry-season text-dry-season-ink" : "bg-rain-season text-forest")}
              >
                {d.seasons[i]}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
            {[
              [d.legendStress, "rgba(245,158,11,.28)"],
              [d.legendBare, "rgba(146,64,14,.18)"],
              [d.legendSelected, "rgba(20,83,45,.12)"],
            ].map(([l, c]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-3.5 rounded-[3px]" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        <ClimateDiagnostic data={getClimate(lang)} />
      </PageContainer>
    </main>
  );
}
