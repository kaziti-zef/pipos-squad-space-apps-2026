import Image from "next/image";
import { CloudRain, CloudSun, Columns3, Droplet, Leaf, Map, ShieldCheck, SlidersHorizontal, Sun } from "lucide-react";
import { AdviceExample } from "@/components/landing/AdviceExample";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { SkyClouds } from "@/components/landing/SkyClouds";
import { Reveal } from "@/components/landing/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

/** Présentation des étapes ; les textes sont dans le dictionnaire (landing.steps.items), dans le même ordre. */
const STEPS = [
  { icon: Map, bg: "bg-leaf-100", fg: "text-forest-700" },
  { icon: CloudSun, bg: "bg-info-100", fg: "text-info-600" },
  { icon: SlidersHorizontal, bg: "bg-warn-100", fg: "text-warn-700" },
  { icon: Columns3, bg: "bg-forest", fg: "text-leaf-300" },
];

const SKY_ICONS = [CloudRain, Sun, Droplet, Leaf];

const RUBRIC_TONES = [
  "bg-leaf-100 text-forest",
  "bg-leaf-100 text-forest",
  "bg-leaf-100 text-forest",
  "bg-warn-100 text-warn-800",
  "bg-danger-100 text-[#991b1b]",
];

export default async function HomePage() {
  const { t, href } = await getI18n();
  const L = t.landing;
  return (
    <div className="min-h-dvh bg-beige text-ink">
      <Hero />

      <Reveal id="comment" className="mx-auto box-border max-w-landing px-4 pb-10 pt-24 md:px-8">
        <p className="eyebrow reveal text-forest-700">{L.steps.eyebrow}</p>
        <h2 className="reveal mb-10 mt-2.5 max-w-[640px] font-display text-[32px] font-bold leading-[1.15] tracking-[-0.8px] md:text-[38px]">
          {L.steps.title}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {L.steps.items.map((item, i) => {
            const { icon: Icon, bg, fg } = STEPS[i];
            const n = String(i + 1).padStart(2, "0");
            return (
              <div key={n} className="reveal card p-7">
                <div className={cn("flex size-12 items-center justify-center rounded-lg", bg)}>
                  <Icon aria-hidden className={cn("size-6", fg)} />
                </div>
                <p className={cn("mb-1.5 mt-[18px] text-sm font-bold", i === 3 ? "text-forest" : fg)}>{n}</p>
                <h3 className="mb-2 font-display text-[19px] font-semibold">{item.title}</h3>
                <p className="leading-[1.55] text-ink-muted">{item.text}</p>
              </div>
            );
          })}
        </div>
        <AdviceExample />
      </Reveal>

      <Reveal id="donnees" className="relative mt-16 overflow-hidden bg-forest-950 text-white">
        <SkyClouds />
        <div className="relative mx-auto box-border flex max-w-landing flex-wrap gap-12 px-4 py-[88px] md:px-8">
          <div className="flex-[1_1_340px]">
            <p className="eyebrow reveal text-leaf-300">{L.sky.eyebrow}</p>
            <h2 className="reveal mb-[18px] mt-2.5 font-display text-[32px] font-bold leading-[1.15] tracking-[-0.8px] md:text-[38px]">
              {L.sky.title}
            </h2>
            <p className="reveal text-[17px] leading-[1.65] text-mist-soft">{L.sky.text}</p>
          </div>
          <div className="grid flex-[2_1_560px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            {L.sky.items.map(({ name, text }, i) => {
              const Icon = SKY_ICONS[i];
              return (
                <div key={name} className="reveal flex gap-4 rounded-[18px] border border-white/12 bg-white/6 p-[22px]">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon aria-hidden className="size-[22px] text-leaf-300" />
                  </span>
                  <div>
                    <p className="font-display text-[17px] font-semibold">{name}</p>
                    <p className="mt-1.5 leading-[1.5] text-mist-soft">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal id="decision" className="mx-auto box-border flex max-w-landing flex-wrap items-center gap-14 px-4 py-24 md:px-8">
        <div className="reveal relative flex-[1_1_420px]">
          <Image
            src="/images/farmers/semis.jpg"
            alt={L.decision.imageAlt}
            width={1600}
            height={798}
            sizes="(min-width: 1280px) 600px, 100vw"
            className="block h-[440px] w-full rounded-4xl object-cover"
          />
          <div className="card absolute inset-x-6 bottom-6 flex items-center gap-3 px-[18px] py-4">
            <ShieldCheck aria-hidden className="size-7 shrink-0 text-forest-700" />
            <p className="text-sm leading-[1.45]">
              {L.decision.cardBefore}
              <strong>{L.decision.cardStrong}</strong>
              {L.decision.cardAfter}
            </p>
          </div>
        </div>
        <div className="flex-[1_1_420px]">
          <p className="eyebrow reveal text-forest-700">{L.decision.eyebrow}</p>
          <h2 className="reveal mb-5 mt-2.5 font-display text-[32px] font-bold leading-[1.15] tracking-[-0.8px] md:text-[38px]">
            {L.decision.title}
          </h2>
          <ul className="flex flex-col gap-3.5">
            {L.decision.rubrics.map((r, i) => (
              <li key={r.title} className="reveal flex gap-3">
                <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold", RUBRIC_TONES[i])}>
                  {i + 1}
                </span>
                <span className="leading-[1.55]">
                  <strong>{r.title}</strong> — {r.text}
                </span>
              </li>
            ))}
          </ul>
          <ButtonLink href={href("/inscription")} className="reveal mt-8 min-h-12 px-[22px] text-[15px]">
            {L.decision.cta}
          </ButtonLink>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
