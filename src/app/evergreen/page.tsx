"use client";

/* Non-Seasonal / Evergreen: the year-round content playbook for Adobe Stock —
   design concepts, format guides (EPS Vector / PNG / JPG), upload process
   and the sales playbook. */

import { useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  Cpu,
  HeartPulse,
  Layers,
  LayoutTemplate,
  Lightbulb,
  Mountain,
  Palette,
  Rocket,
  Search,
  Shapes,
  Sparkles,
  UploadCloud,
  Users,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { Stars } from "@/components/Stars";
import { Pressable } from "@/components/motion";
import { useLang } from "@/i18n/LanguageContext";
import {
  EVERGREEN_CATEGORIES,
  FORMAT_GUIDES,
  SALES_PLAYS,
  UPLOAD_STEPS,
} from "@/lib/evergreen";
import {
  ALL_ITEM_GROUPS,
  GRAPHICAL_ELEMENT_GROUPS,
  TOTAL_TOPICS,
} from "@/lib/evergreen-extra";

const ICONS: Record<string, typeof Briefcase> = {
  Briefcase,
  Cpu,
  HeartPulse,
  Users,
  Layers,
  BarChart3,
  UtensilsCrossed,
  Mountain,
  Shapes,
  LayoutTemplate,
  Palette,
  Sparkles,
};

type Tab = "concepts" | "formats" | "upload" | "sales" | "items" | "graphics";

export default function EvergreenPage() {
  const { t, lang } = useLang();
  const [tab, setTab] = useState<Tab>("concepts");
  const [format, setFormat] = useState<"eps" | "png" | "jpg">("eps");

  const tabs: { id: Tab; label: string }[] = [
    { id: "concepts", label: `① ${t.ev.tabConcepts}` },
    { id: "formats", label: `② ${t.ev.tabFormats}` },
    { id: "upload", label: `③ ${t.ev.tabUpload}` },
    { id: "sales", label: `④ ${t.ev.tabSales}` },
    { id: "items", label: t.ev.tabItems },
    { id: "graphics", label: t.ev.tabGraphics },
  ];

  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ITEM_GROUPS.filter((g) => catFilter === "all" || g.id === catFilter).map((g) => ({
      ...g,
      topics: q
        ? g.topics.filter(
            (tp) => tp.en.toLowerCase().includes(q) || tp.bn.includes(query.trim())
          )
        : g.topics,
    })).filter((g) => g.topics.length > 0);
  }, [query, catFilter]);

  const filteredCount = useMemo(
    () => filteredGroups.reduce((n, g) => n + g.topics.length, 0),
    [filteredGroups]
  );

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

      {/* New-user learning path */}
      <section
        className="card p-5 sm:p-6"
        style={{ background: "linear-gradient(135deg, rgba(201,151,31,.10), rgba(201,151,31,.02))" }}
      >
        <h2 className="font-serif-d text-lg font-semibold">🧭 {t.ev.guideT}</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t.ev.guideSub}
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { n: 1, tab: "concepts", title: t.ev.guideS1T, desc: t.ev.guideS1D },
              { n: 2, tab: "formats", title: t.ev.guideS2T, desc: t.ev.guideS2D },
              { n: 3, tab: "upload", title: t.ev.guideS3T, desc: t.ev.guideS3D },
              { n: 4, tab: "sales", title: t.ev.guideS4T, desc: t.ev.guideS4D },
            ] as const
          ).map((s) => (
            <button
              key={s.n}
              onClick={() => setTab(s.tab)}
              className="card-hover rounded-2xl border p-3.5 text-left"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <span
                className="font-serif-d flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "var(--gold)" }}
              >
                {s.n}
              </span>
              <p className="mt-2 text-sm font-bold">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                {s.desc}
              </p>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button onClick={() => setTab("items")} className="btn btn-ghost !text-xs">
            📚 {t.ev.tabItems}
          </button>
          <button onClick={() => setTab("graphics")} className="btn btn-ghost !text-xs">
            🎨 {t.ev.tabGraphics}
          </button>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {t.ev.guideLibD}
          </span>
        </div>
        <p
          className="mt-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold"
          style={{ background: "rgba(201,151,31,.12)", color: "var(--gold-deep)" }}
        >
          ⚖️ {t.ev.guideRule}
        </p>
      </section>

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
                      <span className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
                        <Stars value={c.stars} size={12} /> {t.ev.salesPotential}
                      </span>
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
                  className="font-serif-d gold-contrast-text z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold"
                  style={{ background: "var(--gold)" }}
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
      {tab === "items" && (
        <section>
          <h2 className="font-serif-d mb-1 text-xl font-semibold">{t.ev.itemsT}</h2>
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>{t.ev.itemsSub}</p>

          {/* Search + category filter */}
          <div className="mb-4 flex flex-col gap-3">
            <label
              className="flex items-center gap-2 rounded-full border px-4 py-2.5"
              style={{ borderColor: "var(--line)", background: "var(--surface2)" }}
            >
              <Search size={16} style={{ color: "var(--muted)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.ev.itemsSearchPh}
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: "var(--ink)" }}
              />
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <Pressable key="all">
                <button
                  onClick={() => setCatFilter("all")}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${catFilter === "all" ? "btn-active" : ""}`}
                  style={catFilter === "all" ? {} : { color: "var(--muted)" }}
                >
                  {t.ev.itemsAll} · {TOTAL_TOPICS}
                </button>
              </Pressable>
              {ALL_ITEM_GROUPS.map((g) => (
                <Pressable key={g.id}>
                  <button
                    onClick={() => setCatFilter(g.id)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${catFilter === g.id ? "btn-active" : ""}`}
                    style={catFilter === g.id ? {} : { color: "var(--muted)" }}
                  >
                    {g.title[lang]} · {g.topics.length}
                  </button>
                </Pressable>
              ))}
            </div>
          </div>

          <p className="mb-4 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold-deep)" }}>
            {t.ev.itemsCount(filteredCount)}
          </p>

          {filteredGroups.length === 0 ? (
            <p className="rounded-2xl border p-6 text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
              {t.ev.itemsNoResult}
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {filteredGroups.map((g) => {
                const Icon = ICONS[g.icon] ?? Lightbulb;
                return (
                  <article key={g.id} className="card p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "rgba(201,151,31,.14)", color: "var(--gold-deep)" }}>
                        <Icon size={17} />
                      </span>
                      <div>
                        <h3 className="font-serif-d text-[16px] font-semibold">{g.title[lang]}</h3>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
                          <Stars value={g.stars} size={11} /> {t.ev.salesPotential}
                        </span>
                      </div>
                      <span className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: "rgba(201,151,31,.14)", color: "var(--gold-deep)" }}>
                        {g.topics.length}
                      </span>
                    </div>
                    <ol className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                      {g.topics.map((tp, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-[13.5px] leading-snug">
                          <span className="font-serif-d mt-px w-7 shrink-0 text-right text-[12px] font-bold" style={{ color: "var(--gold-deep)" }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{tp[lang]}</span>
                        </li>
                      ))}
                    </ol>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "graphics" && (
        <section>
          <h2 className="font-serif-d mb-1 text-xl font-semibold">{t.ev.graphicsT}</h2>
          <p className="mb-5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{t.ev.graphicsSub}</p>
          <div className="flex flex-col gap-5">
            {GRAPHICAL_ELEMENT_GROUPS.map((g) => {
              const Icon = ICONS[g.icon] ?? Shapes;
              return (
                <article key={g.id} className="card p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(201,151,31,.14)", color: "var(--gold-deep)" }}>
                      <Icon size={19} />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif-d text-[17px] font-semibold">{g.title[lang]}</h3>
                        <Stars value={g.stars} size={12} />
                      </div>
                      <p className="text-[12.5px]" style={{ color: "var(--muted)" }}>{g.blurb[lang]}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    {g.elements.map((el, i) => (
                      <div key={i} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--surface2)" }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-[14.5px] font-bold">{el.name[lang]}</h4>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                            style={
                              el.demand === "high"
                                ? { background: "rgba(201,151,31,.18)", color: "var(--gold-deep)" }
                                : { background: "var(--bg2)", color: "var(--muted)", border: "1px solid var(--line)" }
                            }
                          >
                            {el.demand === "high" ? t.ev.demandHigh : t.ev.demandMed}
                          </span>
                          <Stars value={el.stars} size={12} />
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed">
                          <span className="font-bold" style={{ color: "var(--gold-deep)" }}>{t.ev.buyersUse}: </span>
                          <span style={{ color: "var(--muted)" }}>{el.buyers[lang]}</span>
                        </p>
                        <p className="mt-1 text-[13px] leading-relaxed">
                          <span className="font-bold" style={{ color: "var(--gold-deep)" }}>{t.ev.proTip}: </span>
                          <span style={{ color: "var(--muted)" }}>{el.tip[lang]}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
