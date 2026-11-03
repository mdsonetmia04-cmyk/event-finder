"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import DateSelector from "@/components/DateSelector";
import { EventCard, OpportunityCard } from "@/components/cards";
import { CategoryBarChart, StageDonutChart } from "@/components/charts";
import { LiveClock, Marquee, NumberTicker, Pressable, usePointerParallax } from "@/components/motion";
import YearDial from "@/components/YearDial";
import { Deadlines, Faq, HowItWorks, Section, UploadChecklist } from "@/components/sections";
import { EmptyState } from "@/components/ui";
import { useDaysLabel, useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/components/AuthContext";
import LandingPage from "@/components/LandingPage";
import { ASSET_CATEGORIES, COUNTRIES, EVENTS, META, REGIONS, countryByCode } from "@/lib/data";
import { formatLong, formatMonthDay, todayISO } from "@/lib/date-engine";
import {
  getActionGroups,
  getAllOccurrences,
  getOpportunities,
} from "@/lib/recommendation-engine";
import type { EventStatus } from "@/types/event";

const BOARD_STATUSES: EventStatus[] = ["RESEARCH NOW", "CREATE NOW", "UPLOAD NOW", "HIGH PRIORITY", "LAST CHANCE"];
const DAY_MS = 86_400_000;

function DashboardPage() {
  const [date, setDate] = useState(todayISO());
  const [windowDays, setWindowDays] = useState(30);
  const { t } = useLang();
  const daysLabel = useDaysLabel();
  const parallax = usePointerParallax(10);

  const opportunities = useMemo(() => getOpportunities(EVENTS, date, {}, 30), [date]);
  const groups = useMemo(() => getActionGroups(EVENTS, date), [date]);
  const allOcc = useMemo(() => getAllOccurrences(EVENTS, date), [date]);

  const inWindow = useMemo(
    () => allOcc.filter((o) => o.daysUntil >= 0 && o.daysUntil <= windowDays),
    [allOcc, windowDays]
  );
  const planningSet = useMemo(() => allOcc.filter((o) => o.daysUntil >= 0 && o.daysUntil <= 180), [allOcc]);

  const tickerItems = useMemo(
    () =>
      allOcc
        .filter((o) => o.daysUntil >= 0 && o.daysUntil <= 60)
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 14),
    [allOcc]
  );

  /* The screen's one finding: the single most urgent thing to do. */
  const focus = groups["UPLOAD NOW"][0] ?? groups["CREATE NOW"][0] ?? groups["LAST CHANCE"][0] ?? null;
  const focusDlDays = focus
    ? Math.round((Date.parse(focus.submissionDeadline) - Date.parse(date)) / DAY_MS)
    : 0;

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
      q: t.quick.q1,
      a: createToday ? createToday.event.name : t.quick.fallbackA,
      sub: createToday ? `${createToday.daysUntil}d · ${createToday.creationStart}` : t.quick.fallbackSub,
      href: createToday ? `/events/${createToday.event.id}` : "/opportunities",
    },
    {
      q: t.quick.q2,
      a: uploadNow ? uploadNow.event.name : t.quick.uploadFallback,
      sub: uploadNow ? `${uploadNow.score.total} · ${uploadNow.daysUntil}d` : t.quick.fallbackSub,
      href: uploadNow ? `/events/${uploadNow.event.id}` : "/opportunities",
    },
    {
      q: t.quick.q3,
      a: prepareNext ? prepareNext.event.name : t.quick.fallbackA,
      sub: prepareNext ? `${prepareNext.daysUntil}d` : t.quick.fallbackSub,
      href: prepareNext ? `/events/${prepareNext.event.id}` : "/opportunities",
    },
    {
      q: t.quick.q4,
      a: marketCounts.slice(0, 3).map(([c]) => `${countryByCode[c]?.flag} ${countryByCode[c]?.name}`).join(" · ") || "—",
      sub: `${COUNTRIES.length} ${t.hero.statMarkets}`,
      href: "/markets",
    },
  ];

  const confirmedCount = useMemo(() => EVENTS.filter((e) => e.dateStatus === "confirmed").length, []);
  const yearSpan = useMemo(() => {
    const ys = [...new Set(EVENTS.flatMap((e) => Object.keys(e.dates)))].sort();
    return ys.length > 1 ? `${ys[0]}–${ys[ys.length - 1]}` : (ys[0] ?? "");
  }, []);
  const stats = [
    { v: EVENTS.length, l: t.hero.statEvents, d: `${confirmedCount} confirmed · ${EVENTS.length - confirmedCount} provisional` },
    { v: COUNTRIES.length, l: t.hero.statMarkets, d: `${REGIONS.length} regions` },
    { v: META.years.length, l: t.hero.statYears, d: yearSpan },
    { v: BOARD_STATUSES.length, l: t.hero.statStages, d: "research to upload" },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24">
      {/* ---------- Hero ---------- */}
      <section className="hero-ref" aria-label="Hero" onMouseMove={parallax.onMove} onMouseLeave={parallax.onLeave}>
        <svg className="hero-curves" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <path d="M-40 470 C 220 370, 430 560, 710 455 S 1080 370, 1260 465 L1260 640 L-40 640 Z" fill="var(--gold-soft)" opacity="0.38" />
          <path d="M-40 535 C 260 455, 490 600, 770 515 S 1100 465, 1260 535 L1260 640 L-40 640 Z" fill="var(--gold-soft)" opacity="0.24" />
          <path d="M-40 595 C 300 525, 570 640, 850 575 S 1120 555, 1260 595 L1260 640 L-40 640 Z" fill="var(--gold)" opacity="0.12" />
        </svg>
        <div className="hero-grid">
          <motion.div style={{ x: parallax.x, y: parallax.y }} className="min-w-0">
            <div className="hero-dash" aria-hidden="true" />
            <h1 className="hero-title">Sweet Smart Calendar</h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {focus
                ? t.dash.finding(focus.event.name, formatMonthDay(focus.submissionDeadline), daysLabel(focusDlDays))
                : t.dash.findingIdle}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Pressable>
                <Link href="/opportunities" className="btn btn-gold">
                  {t.hero.cta1} <ArrowRight size={16} />
                </Link>
              </Pressable>
              <Pressable>
                <Link href="/calendar" className="btn btn-ghost">
                  {t.hero.cta2}
                </Link>
              </Pressable>
              <span className="inline-flex items-center gap-2 text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                <span className="live-dot" aria-hidden="true" />
                Dhaka <LiveClock />
              </span>
            </div>
            <p className="mt-5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.dash.scrubH}
            </p>
          </motion.div>
          <div className="hero-art">
            <svg className="hero-swoosh" viewBox="0 0 400 420" aria-hidden="true">
              <path d="M 62 332 A 160 178 0 1 1 348 88" fill="none" stroke="var(--gold-2)" strokeWidth="13" strokeLinecap="round" opacity="0.5" />
              <path d="M 62 332 A 160 178 0 1 1 348 88" fill="none" stroke="var(--gold-soft)" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
            </svg>
            <Image
              src="/images/hero-chess-ref-light.png"
              alt="Chess strategy"
              width={680}
              height={580}
              priority
              className="hero-art-img hero-art-img-light"
            />
            <Image
              src="/images/hero-chess-cutout.png"
              alt=""
              aria-hidden="true"
              width={594}
              height={652}
              className="hero-art-img hero-art-img-dark"
            />
          </div>
          <YearDial date={date} onChange={setDate} />
        </div>
      </section>

      {/* ---------- KPI strip ---------- */}
      <section aria-label="Totals">
        <div className="kpi-strip">
          {stats.map((s) => (
            <div key={s.l} className="kpi-cell">
              <span className="kpi-label">{s.l}</span>
              <span className="kpi-value">
                <NumberTicker value={s.v} />
              </span>
              <span className="kpi-delta">{s.d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Quick answers ---------- */}
      <section>
        <h2 className="section-title mb-4">{t.quick.title}</h2>
        <div className="kpi-strip">
          {fourQuestions.map((item) => (
            <Link key={item.q} href={item.href} className="kpi-cell kpi-link">
              <span className="kpi-label">{item.q}</span>
              <span className="kpi-answer">{item.a}</span>
              <span className="kpi-sub tabular-nums">{item.sub}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Event ticker ---------- */}
      <div className="ticker" aria-label="Upcoming events">
        <Marquee duration={55}>
          {tickerItems.map((o) => (
            <span className="ticker-item" key={`${o.event.id}-${o.year}`}>
              <span className="ticker-star" aria-hidden="true">✦</span>
              <b>{o.event.name}</b>
              <span>{formatMonthDay(o.date)} · {daysLabel(o.daysUntil)}</span>
            </span>
          ))}
        </Marquee>
      </div>

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
        title={t.sec.star.title}
        sub={t.sec.star.sub}
        action={
          <Pressable>
            <Link href="/opportunities" className="btn btn-ghost !text-xs">
              {t.sec.star.viewAll} <ArrowRight size={13} />
            </Link>
          </Pressable>
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
      <Section title={t.sec.board.title} sub={t.sec.board.sub}>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {BOARD_STATUSES.map((status) => {
            const list = groups[status];
            return (
              <div className="card flex h-full flex-col gap-2.5 p-3.5" key={status}>
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
        title={t.sec.radar.title(windowDays)}
        sub={t.sec.radar.sub(inWindow.length)}
        action={
          <Pressable>
            <Link href="/calendar" className="btn btn-ghost !text-xs">
              {t.sec.radar.openCal} <ArrowRight size={13} />
            </Link>
          </Pressable>
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
      <Section title={t.sec.charts.byCat} sub={t.sec.charts.byCatSub}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card h-full p-5">
            <CategoryBarChart data={catCounts} labels={t.category} />
          </div>
          <div className="card h-full p-5">
            <h3 className="font-serif-d text-lg font-semibold">{t.sec.charts.stageMix}</h3>
            <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
              {t.sec.charts.stageMixSub}
            </p>
            <StageDonutChart data={stageCounts} labels={t.stage} />
          </div>
        </div>
      </Section>

      {/* ---------- Checklist + FAQ ---------- */}
      <div className="grid gap-16 lg:grid-cols-2 lg:gap-12">
        <UploadChecklist />
        <Faq />
      </div>

      {/* ---------- Markets & assets ---------- */}
      <Section
        title={t.sec.markets.title}
        action={
          <Link href="/markets" className="text-xs font-medium hover:underline" style={{ color: "var(--steel-deep)" }}>
            {t.sec.markets.explore} →
          </Link>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card h-full p-5">
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
          <div className="card h-full p-5">
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

/**
 * "/" is public: logged-out visitors see the marketing landing page,
 * logged-in (approved) users see the dashboard. AuthGate renders this
 * without the app shell when there is no session.
 */
export default function HomePage() {
  const { ready, session } = useAuth();
  if (!ready) return null;
  if (!session) return <LandingPage />;
  return <DashboardPage />;
}
