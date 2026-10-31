"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Factory, Globe2, UploadCloud } from "lucide-react";
import DateSelector from "@/components/DateSelector";
import { EventCard, OpportunityCard } from "@/components/cards";
import { CategoryBarChart, StageDonutChart } from "@/components/charts";
import { EmptyState, SectionHeader } from "@/components/ui";
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
      q: "What should I create today?",
      a: createToday ? createToday.event.name : "Nothing in production window",
      sub: createToday ? `${createToday.daysUntil}d left · create from ${createToday.creationStart}` : "Pick a date to plan",
      href: createToday ? `/events/${createToday.event.id}` : "/opportunities",
      color: "#7B6FD0",
    },
    {
      icon: UploadCloud,
      q: "What should I upload right now?",
      a: uploadNow ? uploadNow.event.name : "Nothing urgent",
      sub: uploadNow ? `Score ${uploadNow.score.total} · ${uploadNow.daysUntil}d left` : "Pick a date to plan",
      href: uploadNow ? `/events/${uploadNow.event.id}` : "/opportunities",
      color: "#2F9E6E",
    },
    {
      icon: CalendarClock,
      q: "Which season should I prepare for next?",
      a: prepareNext ? prepareNext.event.name : "Nothing on the horizon",
      sub: prepareNext ? `${prepareNext.daysUntil}d left · research now` : "Pick a date to plan",
      href: prepareNext ? `/events/${prepareNext.event.id}` : "/opportunities",
      color: "#4D8DCE",
    },
    {
      icon: Globe2,
      q: "Which global markets should I target?",
      a: marketCounts.slice(0, 3).map(([c]) => `${countryByCode[c]?.flag} ${countryByCode[c]?.name}`).join(" · ") || "—",
      sub: `${COUNTRIES.length} markets tracked`,
      href: "/markets",
      color: "#D6A84F",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* ---------- Hero ---------- */}
      <section className="rise pt-2">
        <p className="label mb-2" style={{ color: "var(--gold-deep)" }}>
          Global seasonal intelligence for Adobe Stock contributors
        </p>
        <h1 className="font-serif-d max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          Know What to Create. Know When to Upload.
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
          Your global seasonal intelligence system for smarter Adobe Stock content planning —{" "}
          {EVENTS.length} researched events across {COUNTRIES.length} markets, with date-driven
          creation and submission windows.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {fourQuestions.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.q}
                href={item.href}
                className={`card card-hover rise rise-${i + 1} block p-4`}
                style={{ borderTop: `3px solid ${item.color}` }}
              >
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: item.color }}>
                  <Icon size={13} /> {item.q}
                </p>
                <p className="font-serif-d mt-2 text-[16px] font-semibold leading-snug">{item.a}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {item.sub}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------- Date selection ---------- */}
      <section className="rise rise-2">
        <DateSelector date={date} onDateChange={setDate} windowDays={windowDays} onWindowChange={setWindowDays} />
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          Planning date: <strong style={{ color: "var(--text)" }}>{formatLong(date)}</strong> · All
          recommendations below recalculate instantly for the selected date.
        </p>
      </section>

      {/* ---------- Star opportunities ---------- */}
      <section>
        <SectionHeader
          title="⭐ What to upload right now"
          subtitle="Highest-priority opportunities for your planning date, ranked by a transparent scoring system."
          action={
            <Link href="/opportunities" className="btn btn-ghost !text-xs">
              View all opportunities <ArrowRight size={13} />
            </Link>
          }
        />
        {opportunities.length === 0 ? (
          <EmptyState title="No active opportunities for this date" hint="Try a different planning date." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {opportunities.slice(0, 3).map((opp) => (
              <OpportunityCard key={`${opp.event.id}-${opp.year}`} opp={opp} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Action board ---------- */}
      <section>
        <SectionHeader
          title="Action board"
          subtitle="Every tracked event, grouped by what it needs from you today."
        />
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {BOARD_STATUSES.map((status) => {
            const list = groups[status];
            return (
              <div key={status} className="card flex flex-col gap-2.5 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wide">{status}</span>
                  <span className="chip !px-2 tabular-nums">{list.length}</span>
                </div>
                {list.length === 0 ? (
                  <p className="py-4 text-center text-xs" style={{ color: "var(--muted)" }}>
                    Nothing here
                  </p>
                ) : (
                  list.slice(0, 2).map((occ) => <EventCard key={`${occ.event.id}-${occ.year}`} occ={occ} compact />)
                )}
                {list.length > 2 && (
                  <Link href="/opportunities" className="text-center text-xs font-medium hover:underline" style={{ color: "var(--steel-deep)" }}>
                    +{list.length - 2} more
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- On the radar ---------- */}
      <section>
        <SectionHeader
          title={`On the radar — next ${windowDays} days`}
          subtitle={`${inWindow.length} events occurring in your selected window.`}
          action={
            <Link href="/calendar" className="btn btn-ghost !text-xs">
              Open smart calendar <ArrowRight size={13} />
            </Link>
          }
        />
        {inWindow.length === 0 ? (
          <EmptyState title="Nothing in this window" hint="Widen the window or pick another date." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inWindow.slice(0, 6).map((occ) => (
              <EventCard key={`${occ.event.id}-${occ.year}`} occ={occ} compact />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Charts ---------- */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-serif-d text-lg font-semibold">Upcoming events by category</h3>
          <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
            Next 180 days from your planning date
          </p>
          <CategoryBarChart data={catCounts} />
        </div>
        <div className="card p-5">
          <h3 className="font-serif-d text-lg font-semibold">Preparation stage mix</h3>
          <p className="mb-2 text-xs" style={{ color: "var(--muted)" }}>
            Where your next 180 days stand today
          </p>
          <StageDonutChart data={stageCounts} />
        </div>
      </section>

      {/* ---------- Markets & assets ---------- */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif-d text-lg font-semibold">Top markets right now</h3>
            <Link href="/markets" className="text-xs font-medium hover:underline" style={{ color: "var(--steel-deep)" }}>
              Explore markets →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {marketCounts.map(([code, count]) => (
              <Link key={code} href={`/markets?country=${code}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:opacity-80" style={{ background: "var(--surface2)" }}>
                <span className="text-sm font-medium">
                  {countryByCode[code]?.flag} {countryByCode[code]?.name}
                </span>
                <span className="chip !px-2 tabular-nums">{count} events</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-serif-d text-lg font-semibold">Asset types in demand</h3>
            <Link href="/planner" className="text-xs font-medium hover:underline" style={{ color: "var(--steel-deep)" }}>
              Open asset planner →
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
            Every event recommends specific asset types — vectors, icons, patterns, photos, templates
            and video — matched to what buyers license for that occasion.
          </p>
        </div>
      </section>

      <p className="rounded-xl border px-4 py-3 text-xs leading-relaxed no-print" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        <strong style={{ color: "var(--text)" }}>Last research update: {META.lastResearchUpdate}.</strong>{" "}
        {META.disclaimer}
      </p>
    </div>
  );
}
