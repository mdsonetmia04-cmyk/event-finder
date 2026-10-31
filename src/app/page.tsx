"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Factory, Globe2, UploadCloud } from "lucide-react";
import DateSelector from "@/components/DateSelector";
import { EventCard, OpportunityCard } from "@/components/cards";
import { CategoryBarChart, StageDonutChart } from "@/components/charts";
import { AccentLine, Deadlines, Faq, HowItWorks, Section, UploadChecklist } from "@/components/sections";
import { EmptyState } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import { ASSET_CATEGORIES, COUNTRIES, EVENTS, META, countryByCode } from "@/lib/data";
import { formatLong, todayISO } from "@/lib/date-engine";
import {
  getActionGroups,
  getAllOccurrences,
  getOpportunities,
} from "@/lib/recommendation-engine";
import type { EventStatus } from "@/types/event";

const BOARD_STATUSES: EventStatus[] = ["RESEARCH NOW", "CREATE NOW", "UPLOAD NOW", "HIGH PRIORITY", "LAST CHANCE"];

export default function DashboardPage() {
  const [date, setDate] = useState(todayISO());
  const [windowDays, setWindowDays] = useState(30);
  const { t } = useLang();

  const opportunities = useMemo(() => getOpportunities(EVENTS, date, {}, 30), [date]);
  const groups = useMemo(() => getActionGroups(EVENTS, date), [date]);
  const allOcc = useMemo(() => getAllOccurrences(EVENTS, date), [date]);

  const inWindow = useMemo(
    () => allOcc.filter((o) => o.daysUntil >= 0 && o.daysUntil <= windowDays),
    [allOcc, windowDays]
  );
  const planningSet = useMemo(() => allOcc.filter((o) => o.daysUntil >= 0 && o.daysUntil <= 180), [allOcc]);

  const createToday = groups["CREATE NOW"][0] ?? groups["RESEARCH NOW"][0];
  const uploadNow = opportunities[0];
  const prepareNext = groups["RESEARCH NOW"][0] ?? groups["UPCOMING"][0];

  const marketCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of planningSet) for (const c of o.event.countries) m.set(c, (m.get(c) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [planningSet]);

  const catCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of planningSet) m.set(o.event.category, (m.get(o.event.category) ?? 0) + 1);
    return [...m.entries()].map(([category, count]) => ({ category: category as never, count }));
  }, [planningSet]);

  const stageCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of planningSet) m.set(o.stage, (m.get(o.stage) ?? 0) + 1);
    return [...m.entries()].map(([stage, count]) => ({ stage: stage as never, count }));
  }, [planningSet]);

  const fourQuestions = [
    {
      icon: Factory,
      q: t.quick.q1,
      a: createToday ? createToday.event.name : t.quick.fallbackA,
      sub: createToday ? `${createToday.daysUntil}d · ${createToday.creationStart}` : t.quick.fallbackSub,
      href: createToday ? `/events/${createToday.event.id}` : "/opportunities",
    },
    {
      icon: UploadCloud,
      q: t.quick.q2,
      a: uploadNow ? uploadNow.event.name : t.quick.uploadFallback,
      sub: uploadNow ? `${uploadNow.score.total} · ${uploadNow.daysUntil}d` : t.quick.fallbackSub,
      href: uploadNow ? `/events/${uploadNow.event.id}` : "/opportunities",
    },
    {
      icon: CalendarClock,
      q: t.quick.q3,
      a: prepareNext ? prepareNext.event.name : t.quick.fallbackA,
      sub: prepareNext ? `${prepareNext.daysUntil}d` : t.quick.fallbackSub,
      href: prepareNext ? `/events/${prepareNext.event.id}` : "/opportunities",
    },
    {
      icon: Globe2,
      q: t.quick.q4,
      a: marketCounts.slice(0, 3).map(([c]) => `${countryByCode[c]?.flag} ${countryByCode[c]?.name}`).join(" · ") || "—",
      sub: `${COUNTRIES.length} ${t.hero.statMarkets}`,
      href: "/markets",
    },
  ];

  const stats = [
    { v: EVENTS.length, l: t.hero.statEvents },
    { v: COUNTRIES.length, l: t.hero.statMarkets },
    { v: META.years.length, l: t.hero.statYears },
    { v: BOARD_STATUSES.length, l: t.hero.statStages },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* ---------- Hero ---------- */}
      <section className="hero rise">
        <span className="hero-eyebrow">{t.hero.eyebrow}</span>
        <h1 className="hero-title">
          {t.hero.line1}
          <br />
          <AccentLine line={t.hero.line2} accent={t.hero.accent} />
        </h1>
        <p className="hero-sub">{t.hero.sub(EVENTS.length, COUNTRIES.length)}</p>
        <div className="hero-cta">
          <Link href="/opportunities" className="btn btn-gold">
            {t.hero.cta1} <ArrowRight size={16} />
          </Link>
          <Link href="/calendar" className="btn btn-ghost">
            {t.hero.cta2}
          </Link>
        </div>
        <div className="hero-stats">
          {stats.map((s) => (
            <div key={s.l} className="hero-stat">
              <b>{s.v}</b>
              <span>{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Quick answers ---------- */}
      <section>
        <div className="section-head">
          <p className="section-eyebrow">{t.quick.eyebrow}</p>
          <h2 className="section-title">{t.quick.title}</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {fourQuestions.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.q}
                href={item.href}
                className={`card card-hover rise rise-${i + 1} block p-5`}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "color-mix(in srgb, var(--gold) 14%, transparent)", color: "var(--gold-deep)" }}
                >
                  <Icon size={17} />
                </span>
                <p className="label mt-3">{item.q}</p>
                <p className="font-serif-d mt-1.5 text-[16px] font-semibold leading-snug">{item.a}</p>
                <p className="mt-1 text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                  {item.sub}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Date selection ---------- */}
      <section>
        <DateSelector date={date} onDateChange={setDate} windowDays={windowDays} onWindowChange={setWindowDays} />
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          {t.dateSel.planningFor} <strong style={{ color: "var(--text)" }}>{formatLong(date)}</strong> ·{" "}
          {t.dateSel.recalc}
        </p>
      </section>

      {/* ---------- Star opportunities ---------- */}
      <Section
        eyebrow={t.sec.star.eyebrow}
        title={t.sec.star.title}
        sub={t.sec.star.sub}
        action={
          <Link href="/opportunities" className="btn btn-ghost !text-xs">
            {t.sec.star.viewAll} <ArrowRight size={13} />
          </Link>
        }
      >
        {opportunities.length === 0 ? (
          <EmptyState title={t.sec.star.emptyT} hint={t.sec.star.emptyH} />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {opportunities.slice(0, 3).map((opp) => (
              <OpportunityCard key={`${opp.event.id}-${opp.year}`} opp={opp} />
            ))}
          </div>
        )}
      </Section>

      {/* ---------- Deadlines ---------- */}
      <Deadlines occurrences={allOcc} />

      {/* ---------- Action board ---------- */}
      <Section
        eyebrow={t.sec.board.eyebrow}
        title={t.sec.board.title}
        sub={t.sec.board.sub}
      >
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {BOARD_STATUSES.map((status) => {
            const list = groups[status];
            return (
              <div key={status} className="card flex flex-col gap-2.5 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wide">{t.status[status] ?? status}</span>
                  <span className="chip !px-2 tabular-nums">{list.length}</span>
                </div>
                {list.length === 0 ? (
                  <p className="py-4 text-center text-xs" style={{ color: "var(--muted)" }}>
                    {t.sec.board.empty}
                  </p>
                ) : (
                  list.slice(0, 2).map((occ) => <EventCard key={`${occ.event.id}-${occ.year}`} occ={occ} compact />)
                )}
                {list.length > 2 && (
                  <Link href="/opportunities" className="text-center text-xs font-medium hover:underline" style={{ color: "var(--steel-deep)" }}>
                    {t.sec.board.more(list.length - 2)}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ---------- On the radar ---------- */}
      <Section
        eyebrow={t.sec.radar.eyebrow}
        title={t.sec.radar.title(windowDays)}
        sub={t.sec.radar.sub(inWindow.length)}
        action={
          <Link href="/calendar" className="btn btn-ghost !text-xs">
            {t.sec.radar.openCal} <ArrowRight size={13} />
          </Link>
        }
      >
        {inWindow.length === 0 ? (
          <EmptyState title={t.sec.radar.emptyT} hint={t.sec.radar.emptyH} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inWindow.slice(0, 6).map((occ) => (
              <EventCard key={`${occ.event.id}-${occ.year}`} occ={occ} compact />
            ))}
          </div>
        )}
      </Section>

      {/* ---------- How it works ---------- */}
      <HowItWorks />

      {/* ---------- Charts ---------- */}
      <Section
        title={t.sec.charts.byCat}
        sub={t.sec.charts.byCatSub}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-serif-d text-lg font-semibold">{t.sec.charts.byCat}</h3>
            <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
              {t.sec.charts.byCatSub}
            </p>
            <CategoryBarChart data={catCounts} labels={t.category} />
          </div>
          <div className="card p-5">
            <h3 className="font-serif-d text-lg font-semibold">{t.sec.charts.stageMix}</h3>
            <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
              {t.sec.charts.stageMixSub}
            </p>
            <StageDonutChart data={stageCounts} labels={t.stage} />
          </div>
        </div>
      </Section>

      {/* ---------- Checklist + FAQ ---------- */}
      <div className="grid gap-10 lg:grid-cols-2">
        <UploadChecklist />
        <Faq />
      </div>

      {/* ---------- Markets & assets ---------- */}
      <Section
        eyebrow={t.sec.markets.eyebrow}
        title={t.sec.markets.title}
        action={
          <Link href="/markets" className="text-xs font-medium hover:underline" style={{ color: "var(--steel-deep)" }}>
            {t.sec.markets.explore} →
          </Link>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <div className="grid gap-2 sm:grid-cols-2">
              {marketCounts.map(([code, count]) => (
                <Link key={code} href={`/markets?country=${code}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:opacity-80" style={{ background: "var(--surface2)" }}>
                  <span className="text-sm font-medium">
                    {countryByCode[code]?.flag} {countryByCode[code]?.name}
                  </span>
                  <span className="chip !px-2 tabular-nums">{count} {t.sec.markets.eventsSuffix}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif-d text-lg font-semibold">{t.sec.assets.title}</h3>
              <Link href="/planner" className="text-xs font-medium hover:underline" style={{ color: "var(--steel-deep)" }}>
                {t.sec.assets.open} →
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ASSET_CATEGORIES.map((a) => (
                <span key={a.id} className="chip" title={a.description}>
                  {a.name}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.sec.assets.desc}
            </p>
          </div>
        </div>
      </Section>

      <p className="rounded-xl border px-4 py-3 text-xs leading-relaxed no-print" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        <strong style={{ color: "var(--text)" }}>{t.footer.lastUpdate}: {META.lastResearchUpdate}.</strong>{" "}
        {META.disclaimer}
      </p>
    </div>
  );
}
