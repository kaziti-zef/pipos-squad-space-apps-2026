import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AlertTriangle, BadgeDollarSign, CircleHelp, Globe, LineChart } from "lucide-react";
import { DisclaimerBanner } from "@/components/ui/Banner";
import { ButtonLink } from "@/components/ui/Button";
import { PageContainer } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { PrintButton } from "@/components/strategy/PrintButton";
import { Reminders } from "@/components/strategy/Reminders";
import { getI18n } from "@/i18n/server";
import { cropStyle } from "@/lib/domain/crops";
import { strategies } from "@/lib/mocks";
import { getStrategies } from "@/lib/mocks/localized";
import { cn, fr } from "@/lib/utils";

type Props = PageProps<"/[lang]/parcelles/[parcelId]/strategies/[strategyId]">;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.fiche.pageTitle };
}

function Section({
  icon,
  iconBg,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  iconBg: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card flex flex-col gap-3 p-[22px]", className)}>
      <h2 className="flex items-center gap-3 font-display text-[19px] font-semibold">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", iconBg)}>{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Item({ tag, tagClass, children }: { tag: string; tagClass: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-[15px] leading-[1.55]">
      <span className={cn("mt-0.5 shrink-0 rounded-xs px-2 py-0.5 text-sm font-bold", tagClass)}>{tag}</span>
      <span>{children}</span>
    </div>
  );
}

/**
 * Étiquette d'un facteur « Pourquoi » (fr et en).
 * Avec l'API, le signe et les points viendront des facteurs de calcul (contrat §10, note 4).
 */
function whyTag(text: string): [string, string] {
  if (text.includes("R2")) return ["+8", "bg-leaf-100 text-forest"];
  if (/−25|Pénalité|Penalty/.test(text)) return ["−25", "bg-danger-100 text-danger-800"];
  if (/respectée|tolérantes|\bmet\b|tolerant/.test(text)) return ["+", "bg-leaf-100 text-forest"];
  return ["−", "bg-danger-100 text-danger-800"];
}

const MINE = /^(Vos saisies|Your inputs)\s*:\s*/;

function proofSource(text: string, mineLabel: string): [string, string, boolean] {
  if (MINE.test(text)) return [mineLabel, "bg-leaf-100 text-forest", true];
  if (text.includes("SMAP")) return ["SMAP", "bg-info-soft text-info-800", false];
  if (text.includes("SRTM")) return ["NASA POWER · SRTM", "bg-info-soft text-info-800", false];
  return ["NASA POWER", "bg-info-soft text-info-800", false];
}

const BENEFIT_STYLE = [
  ["bg-leaf-50", "text-forest"],
  ["bg-[#eff6ff]", "text-info-800"],
  ["bg-warn-50", "text-warn-800"],
  ["bg-[#fdf4ec]", "text-sweet-800"],
];

const TAG_STYLE = {
  existing: "bg-stone text-ink-soft",
  recommended: "bg-forest text-white",
  alternative: "bg-info-100 text-info-800",
} as const;

export function generateStaticParams() {
  return strategies.strategies.map((s) => ({ strategyId: s.id }));
}

export default function StrategyDetailPage({ params, searchParams }: Props) {
  return (
    <main className="flex-1">
      <DisclaimerBanner />
      <Suspense fallback={<PageSkeleton width="narrow" />}>
        <StrategySheet params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function StrategySheet({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ parcelId, strategyId }, query, { t, lang, href }] = await Promise.all([params, searchParams, getI18n()]);
  const f = t.fiche;
  const lowConfidence = query.confiance === "faible";
  const s = getStrategies(lang).strategies.find((x) => x.id === strategyId);
  if (!s) notFound();

  const conf = lowConfidence
    ? { label: f.levelLow, cls: "bg-warn-100 text-warn-800" }
    : s.confidence.score >= 0.8
      ? { label: f.levelHigh, cls: "bg-leaf-100 text-forest" }
      : { label: f.levelMid, cls: "bg-warn-100 text-warn-800" };

  const gaps = lowConfidence ? f.lowGaps : s.explanation.information_gaps;

  const gapsSection = (
    <Section
      icon={<CircleHelp aria-hidden className={cn("size-[22px]", lowConfidence ? "text-warn-700" : "text-ink-muted")} />}
      iconBg={lowConfidence ? "bg-warn-100" : "bg-sand-200"}
      title={lowConfidence ? f.gapsPriority : f.gaps}
      className={lowConfidence ? "bg-warn-50 outline-2 outline-warn-300 outline" : undefined}
    >
      {gaps.length ? (
        gaps.map((g) => (
          <Item
            key={g}
            tag={lowConfidence ? f.gapDefaultTag : f.gapTag}
            tagClass={lowConfidence ? "bg-warn-100 text-warn-800" : "bg-stone text-ink-soft"}
          >
            {g}
          </Item>
        ))
      ) : (
        <p className="text-ink-muted">{t.common.unavailable}</p>
      )}
      {lowConfidence && (
        <ButtonLink href={href(`/parcelles/${parcelId}/terrain`)} variant="warn" className="self-start">
          {f.complete}
        </ButtonLink>
      )}
    </Section>
  );

  return (
    <PageContainer width="narrow" className="gap-[18px]">
      <Link href={href(`/parcelles/${parcelId}/strategies`)} className="no-print inline-flex min-h-11 items-center self-start text-sm font-semibold no-underline">
        {t.common.backStrategies}
      </Link>

      <header className="card flex flex-col gap-[18px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-[18px]">
          <div>
            <span className={cn("inline-block rounded-full px-2.5 py-1 text-[13px] font-bold", TAG_STYLE[s.id])}>{t.strategies.tags[s.id]}</span>
            <h1 className="mb-1 mt-2.5 font-display text-[28px] font-bold tracking-[-0.5px]">{s.name}</h1>
            <p className="text-ink-muted">{f.computedOn}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="min-w-24 rounded-lg bg-leaf-100 px-4 py-3 text-forest">
              <p className="text-[13px] font-semibold">{f.score}</p>
              <p className="mt-0.5 font-display text-2xl font-bold">{fr(s.score, 1, lang)}</p>
            </div>
            <div className="min-w-24 rounded-lg bg-beige px-4 py-3">
              <p className="text-[13px] font-semibold text-ink-muted">{f.stability}</p>
              <p className="mt-0.5 font-display text-2xl font-bold">{fr(s.resilience_index, 2, lang)}</p>
            </div>
            <div className={cn("min-w-24 rounded-lg px-4 py-3", conf.cls)}>
              <p className="text-[13px] font-semibold">{f.confidence}</p>
              <p className="mt-0.5 font-display text-2xl font-bold">{conf.label}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {s.sequence.map((e) => (
            <div key={e.season} className="flex-[1_1_90px] rounded-sm px-2 py-2.5 text-center" style={{ background: cropStyle(e.crop_id).bg }}>
              <small className="block text-[13px] font-semibold text-ink-muted">{e.label}</small>
              <b className="text-sm">{t.crops[e.crop_id as keyof typeof t.crops]}</b>
            </div>
          ))}
        </div>
      </header>

      {lowConfidence && gapsSection}

      <Section icon={<LineChart aria-hidden className="size-[22px] text-forest-700" />} iconBg="bg-leaf-100" title={f.why}>
        {s.explanation.why.map((w) => {
          const [tag, cls] = whyTag(w);
          return (
            <Item key={w} tag={tag} tagClass={cls}>
              {w}
            </Item>
          );
        })}
      </Section>

      <Section icon={<Globe aria-hidden className="size-[22px] text-info-600" />} iconBg="bg-info-100" title={f.proofs}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
          {s.explanation.proofs.map((p) => {
            const [src, cls, mine] = proofSource(p, f.yourInputs);
            return (
              <div key={p} className={cn("flex flex-col gap-2 rounded-lg p-3.5", mine ? "bg-beige" : "bg-info-50")}>
                <span className={cn("self-start rounded-full px-2.5 py-[3px] text-[13px] font-semibold", cls)}>{src}</span>
                <p className="text-sm leading-[1.5]">{p.replace(MINE, "")}</p>
              </div>
            );
          })}
        </div>
      </Section>

      <Section icon={<BadgeDollarSign aria-hidden className="size-[22px] text-warn-700" />} iconBg="bg-warn-100" title={f.benefits}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
          {s.explanation.benefits.map((b, i) => {
            const [bg, ink] = BENEFIT_STYLE[i % BENEFIT_STYLE.length];
            return (
              <div key={b} className={cn("rounded-lg p-3.5", bg)}>
                <p className={cn("font-bold", ink)}>{f.benefitTitles[i % f.benefitTitles.length]}</p>
                <p className="mt-1 text-sm text-ink-soft">{b}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {!lowConfidence && gapsSection}

      <Section icon={<AlertTriangle aria-hidden className="size-[22px] text-danger-600" />} iconBg="bg-danger-100" title={f.risks}>
        {s.explanation.local_risks_to_check.map((r, i) => (
          <Item key={r} tag={f.riskTags[i === 0 ? 0 : 1]} tagClass="bg-danger-100 text-danger-800">
            {r}
          </Item>
        ))}
        <p className="mt-1 text-sm text-ink-muted">{f.riskFooter}</p>
      </Section>

      <section className="card flex flex-col gap-3 p-[22px]">
        <h2 className="font-display text-[17px] font-semibold">{f.notes}</h2>
        <div className="flex gap-3 rounded-lg bg-leaf-50 p-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-info-600 font-bold text-white">AF</div>
          <div>
            <p className="font-semibold">
              A. Fouda <span className="font-medium text-ink-muted">{f.noteMeta}</span>{" "}
              <span className="ml-1.5 rounded-full bg-leaf-100 px-2 py-0.5 text-[13px] text-forest">{f.validation}</span>
            </p>
            <p className="mt-1 leading-[1.5]">{f.noteText}</p>
          </div>
        </div>
        <label className="no-print flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{f.addNote}</span>
          <textarea rows={2} placeholder={f.notePlaceholder} className="field-input resize-y py-3" />
        </label>
      </section>

      <Reminders crop={t.crops[s.sequence[0].crop_id as keyof typeof t.crops] ?? s.sequence[0].crop_name} year={s.sequence[0].label.slice(0, 4)} />

      <div className="no-print flex flex-wrap justify-end gap-2.5">
        <PrintButton />
        <ButtonLink href={href(`/parcelles/${parcelId}/historique`)}>{f.retain}</ButtonLink>
      </div>
    </PageContainer>
  );
}
