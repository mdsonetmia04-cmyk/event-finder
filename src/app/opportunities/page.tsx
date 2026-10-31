"use client";

/* Opportunities as a kanban pipeline, in the language of Dribbble's
   "CRM Dashboard App Design" (Ronas IT): warm ivory columns, one stage per
   status, events flowing left to right as deadlines approach. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Info, Search } from "lucide-react";
import { EmptyState, PriorityBadge, SectionHeader } from "@/components/ui";
import {
  CATEGORY_LABEL,
  COUNTRIES,
  EVENTS,
  REGIONS,
} from "@/lib/data";
import { isValidISODate, todayISO } from "@/lib/date-engine";
import {
  SCORE_WEIGHTS,
  STATUS_STYLE,
  getOpportunities,
} from "@/lib/recommendation-engine";
import { useDaysLabel, useLang } from "@/i18n/LanguageContext";
import type { EventCategory, EventStatus, Opportunity, PriorityLabel } from "@/types/event";

const PIPELINE: EventStatus[] = [
  "RESEARCH NOW",
  "CREATE NOW",
  "UPLOAD NOW",
  "HIGH PRIORITY",
  "LAST CHANCE",
  "UPCOMING",
];
const ALL_PRIORITIES: PriorityLabel[] = ["critical", "high", "recommended", "watch"];

function KanbanCard({ opp }: { opp: Opportunity }) {
  const { t } = useLang();
  const daysLabel = useDaysLabel();
  const e = opp.event;
  const urgent = opp.daysUntil >= 0 && opp.daysUntil <= 14;
  return (
    <Link href={`/events/${e.id}`} className="kanban-card">
      <div className="flex items-start justify-between gap-2">
        <span className="kanban-card-title">{e.name}</span>
        <span className="kanban-score tabular-nums" title={t.cards.priorityScore}>
          {opp.score.total}
        </span>
      </div>
      <p className="mt-1 text-[12.5px]" style={{ color: urgent ? "var(--gold-deep)" : "var(--muted)" }}>
        <strong>{daysLabel(opp.daysUntil)}</strong>
        <span style={{ color: "var(--muted)" }}> · {CATEGORY_LABEL[e.category]}</span>
      </p>
      <div className="mt-2.5 flex items-center justify-between">
        <PriorityBadge priority={opp.priority} showStars={false} />
        <ArrowUpRight size={14} style={{ color: "var(--muted)" }} aria-hidden="true" />
      </div>
    </Link>
  );
}

function KanbanColumn({ status, items }: { status: EventStatus; items: Opportunity[] }) {
  const { t } = useLang();
  const s = STATUS_STYLE[status];
  return (
    <section className="kanban-col" aria-label={t.status[status] ?? status}>
      <header className="kanban-col-head">
        <span className="kanban-dot" style={{ background: s.fg }} aria-hidden="true" />
        <h3 className="kanban-col-title">{t.status[status] ?? status}</h3>
        <span className="kanban-count tabular-nums">{items.length}</span>
      </header>
      <div className="kanban-col-body">
        {items.length === 0 ? (
          <p className="kanban-empty" aria-hidden="true">—</p>
        ) : (
          items.map((opp) => <KanbanCard key={`${opp.event.id}-${opp.year}`} opp={opp} />)
        )}
      </div>
    </section>
  );
}

export default function OpportunitiesPage() {
  const [date, setDate] = useState(todayISO());
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [showHow, setShowHow] = useState(false);
  const { t } = useLang();

  const opportunities = useMemo(
    () =>
      getOpportunities(
        EVENTS,
        date,
        {
          query: query || undefined,
          countries: country ? [country] : undefined,
          regions: region ? [region] : undefined,
          categories: category ? [category as EventCategory] : undefined,
          priorities: priority ? [priority as PriorityLabel] : undefined,
        },
        120
      ),
    [date, query, country, region, category, priority]
  );

  const columns = useMemo(() => {
    const map = new Map<EventStatus, Opportunity[]>();
    for (const s of PIPELINE) map.set(s, []);
    for (const opp of opportunities) {
      const list = map.get(opp.status);
      if (list) list.push(opp);
    }
    return map;
  }, [opportunities]);

  const hasFilters = query || country || region || category || priority;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title={t.opp.title}
        subtitle={t.opp.sub}
        action={
          <button className="btn btn-ghost !text-xs" onClick={() => setShowHow((s) => !s)}>
            <Info size={13} /> {t.opp.howScoring}
          </button>
        }
      />

      {showHow && (
        <div className="card rise p-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          <p className="mb-2 font-semibold" style={{ color: "var(--text)" }}>
            {t.opp.weightsT}
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            <li>· {t.opp.wTiming(Math.round(SCORE_WEIGHTS.timing * 100))}</li>
            <li>· {t.opp.wMarket(Math.round(SCORE_WEIGHTS.market * 100))}</li>
            <li>· {t.opp.wDemand(Math.round(SCORE_WEIGHTS.demand * 100))}</li>
            <li>· {t.opp.wVers(Math.round(SCORE_WEIGHTS.versatility * 100))}</li>
            <li>· {t.opp.wConf(Math.round(SCORE_WEIGHTS.confidence * 100))}</li>
          </ul>
          <p className="mt-2 text-xs">{t.opp.legend}</p>
        </div>
      )}

      {/* Date + filters */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays size={15} style={{ color: "var(--gold-deep)" }} />
          <input
            type="date"
            className="input !w-auto"
            value={date}
            min="2026-01-01"
            max="2028-12-31"
            onChange={(e) => isValidISODate(e.target.value) && setDate(e.target.value)}
            aria-label="Planning date"
          />
        </label>
        <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => setDate(todayISO())}>
          {t.opp.today}
        </button>
        <span className="mx-1 hidden h-6 w-px sm:block" style={{ background: "var(--line)" }} />
        <label className="relative min-w-[160px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input className="input !pl-9" placeholder={t.opp.searchPh} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="input !w-auto" value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t.opp.allCountries}>
          <option value="">{t.opp.allCountries}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
        <select className="input !w-auto" value={region} onChange={(e) => setRegion(e.target.value)} aria-label={t.opp.allRegions}>
          <option value="">{t.opp.allRegions}</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select className="input !w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t.opp.allTypes}>
          <option value="">{t.opp.allTypes}</option>
          {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => (
            <option key={c} value={c}>{t.category[c] ?? CATEGORY_LABEL[c]}</option>
          ))}
        </select>
        <select className="input !w-auto" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label={t.opp.allPriorities}>
          <option value="">{t.opp.allPriorities}</option>
          {ALL_PRIORITIES.map((p) => (
            <option key={p} value={p} className="capitalize">{t.priority[p] ?? p}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            onClick={() => { setQuery(""); setCountry(""); setRegion(""); setCategory(""); setPriority(""); }}
          >
            {t.opp.clear}
          </button>
        )}
      </div>

      <p className="text-sm" style={{ color: "var(--muted)" }}>
        <strong style={{ color: "var(--text)" }} className="tabular-nums">{t.opp.ranked(opportunities.length)}</strong>
        {" · "}{t.opp.pipeHint}
      </p>

      {opportunities.length === 0 ? (
        <EmptyState title={t.opp.emptyT} hint={t.opp.emptyH} />
      ) : (
        <div className="kanban-board">
          {PIPELINE.map((s) => (
            <KanbanColumn key={s} status={s} items={columns.get(s) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}
