"use client";

/* Non-Seasonal / Evergreen: the year-round content playbook for Adobe Stock —
   design concepts, format guides (EPS Vector / PNG / JPG), upload process
   and the sales playbook. */

import { useState } from "react";
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  Cpu,
  HeartPulse,
  Layers,
  Lightbulb,
  Mountain,
  Rocket,
  UploadCloud,
  Users,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { Pressable } from "@/components/motion";
import { useLang } from "@/i18n/LanguageContext";
import {
  EVERGREEN_CATEGORIES,
  FORMAT_GUIDES,
  SALES_PLAYS,
  UPLOAD_STEPS,
} from "@/lib/evergreen";

const ICONS: Record<string, typeof Briefcase> = {
  Briefcase,
  Cpu,
  HeartPulse,
  Users,
  Layers,
  BarChart3,
  UtensilsCrossed,
  Mountain,
};

type Tab = "concepts" | "formats" | "upload" | "sales";

export default function EvergreenPage() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>("concepts");
  const [format, setFormat] = useState<"eps" | "png" | "jpg">("eps");

  const tabs: { id: Tab; label: string }[] = [
    { id: "concepts", label: t.ev.tabConcepts },
    { id: "formats", label: t.ev.tabFormats },
    { id: "upload", label: t.ev.tabUpload },
    { id: "sales", label: t.ev.tabSales },
  ];

  const activeFormat = FORMAT_GUIDES.find((f) => f.id === format)!;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={t.ev.title}
        subtitle={t.ev.sub}
        action={
          <span className="chip !border-0 !text-xs font-bold" style={{ background: "rgba(201,151,31,.16)", color: "var(--gold-deep)" }}>
            {t.ev.badge}
          </span>
        }
      />

      {/* Tab bar */}
      <div className="sticky top-[57px] z-20 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6" style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(10px)" }}>
        <div className="flex gap-1.5 overflow-x-auto">
          {tabs.map((tb) => (
            <Pressable key={tb.id}>
              <button
                onClick={() => setTab(tb.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                  tab === tb.id ? "btn-active" : ""
                }`}
                style={tab === tb.id ? {} : { color: "var(--muted)" }}
              >
                {tb.label}
              </button>
            </Pressable>
          ))}
        </div>
      </div>

      {tab === "concepts" && (
        <section>
          <h2 className="font-serif-d mb-1 text-xl font-semibold">{t.ev.conceptsT}</h2>
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>{t.ev.conceptsSub}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {EVERGREEN_CATEGORIES.map((c) => {
              const Icon = ICONS[c.icon] ?? Lightbulb;
              return (
                <article key={c.id} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(201,151,31,.14)", color: "var(--gold-deep)" }}>
                      <Icon size={19} />
                    </span>
                    <div>
                      <h3 className="font-serif-d text-[17px] font-semibold">{c.title[lang]}</h3>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    {c.blurb[lang]}
                  </p>
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {c.concepts.map((k, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13.5px] leading-snug">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} />
                        <span>{k[lang]}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {tab === "formats" && (
        <section>
          <h2 className="font-serif-d mb-1 text-xl font-semibold">{t.ev.formatsT}</h2>
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>{t.ev.formatsSub}</p>
          <div className="mb-4 flex gap-1.5">
            {FORMAT_GUIDES.map((f) => (
              <Pressable key={f.id}>
                <button
                  onClick={() => setFormat(f.id)}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${format === f.id ? "btn-active" : ""}`}
                  style={format === f.id ? {} : { color: "var(--muted)" }}
                >
                  {f.tab[lang]}
                </button>
              </Pressable>
            ))}
          </div>
          <div className="card p-5 sm:p-6">
            <p className="font-serif-d text-lg font-semibold">{activeFormat.tab[lang]}</p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {activeFormat.tagline[lang]}
            </p>

            <h4 className="label mt-5 mb-2">{t.ev.specsT}</h4>
            <dl className="grid gap-2 sm:grid-cols-2">
              {activeFormat.specs.map((s, i) => (
                <div key={i} className="rounded-xl px-3.5 py-2.5" style={{ background: "var(--surface2)" }}>
                  <dt className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    {s.label[lang]}
                  </dt>
                  <dd className="mt-0.5 text-[13.5px] font-semibold">{s.value[lang]}</dd>
                </div>
              ))}
            </dl>

            <h4 className="label mt-5 mb-2 flex items-center gap-1.5">
              <Lightbulb size={13} /> {t.ev.ideasT}
            </h4>
            <ul className="flex flex-col gap-1.5">
              {activeFormat.ideas.map((idea, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px] leading-snug">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} />
                  <span>{idea[lang]}</span>
                </li>
              ))}
            </ul>

            <h4 className="label mt-5 mb-2 flex items-center gap-1.5">
              <Wrench size={13} /> {t.ev.tipsT}
            </h4>
            <ul className="flex flex-col gap-1.5">
              {activeFormat.tips.map((tip, i) => (
                <li key={i} className="rounded-xl px-3.5 py-2.5 text-[13.5px] leading-relaxed" style={{ background: "rgba(201,151,31,.08)", border: "1px solid var(--line)" }}>
                  {tip[lang]}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab === "upload" && (
        <section>
          <h2 className="font-serif-d mb-1 flex items-center gap-2 text-xl font-semibold">
            <UploadCloud size={20} style={{ color: "var(--gold-deep)" }} /> {t.ev.uploadT}
          </h2>
          <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>{t.ev.uploadSub}</p>
          <ol className="relative flex flex-col gap-0">
            {UPLOAD_STEPS.map((s, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {i < UPLOAD_STEPS.length - 1 && (
                  <span className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-px" style={{ background: "var(--line)" }} aria-hidden="true" />
                )}
                <span
                  className="font-serif-d z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
                  style={{ background: "var(--gold)", color: "#1a1405" }}
                >
                  {i + 1}
                </span>
                <div className="card flex-1 p-4">
                  <h3 className="font-semibold leading-snug">{s.title[lang]}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                    {s.body[lang]}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {tab === "sales" && (
        <section>
          <h2 className="font-serif-d mb-1 flex items-center gap-2 text-xl font-semibold">
            <Rocket size={20} style={{ color: "var(--gold-deep)" }} /> {t.ev.salesT}
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>{t.ev.salesSub}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {SALES_PLAYS.map((p, i) => (
              <article key={i} className="card p-5">
                <p className="font-serif-d text-[15px] font-bold" style={{ color: "var(--gold-deep)" }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-serif-d mt-1 text-[17px] font-semibold">{p.title[lang]}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {p.body[lang]}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
