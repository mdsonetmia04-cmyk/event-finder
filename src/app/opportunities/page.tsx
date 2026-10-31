"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Info, Search } from "lucide-react";
import { OpportunityCard } from "@/components/cards";
import { EmptyState, SectionHeader } from "@/components/ui";
import {
  CATEGORY_LABEL,
  COUNTRIES,
  EVENTS,
  REGIONS,
} from "@/lib/data";
import { isValidISODate, todayISO } from "@/lib/date-engine";
import { getOpportunities, SCORE_WEIGHTS } from "@/lib/recommendation-engine";
import type { EventCategory, EventStatus, PriorityLabel } from "@/types/event";

const ALL_PRIORITIES: PriorityLabel[] = ["critical", "high", "recommended", "watch"];
const ALL_STATUSES: EventStatus[] = ["RESEARCH NOW", "CREATE NOW", "UPLOAD NOW", "HIGH PRIORITY", "UPCOMING", "LAST CHANCE"];

export default function OpportunitiesPage() {
  const [date, setDate] = useState(todayISO());
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [showHow, setShowHow] = useState(false);

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
          statuses: status ? [status as EventStatus] : undefined,
        },
        60
      ),
    [date, query, country, region, category, priority, status]
  );

  const hasFilters = query || country || region || category || priority || status;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title="⭐ Seasonal Opportunities"
        subtitle="Ranked by priority score for your planning date. Scores are internal planning indicators, not measured sales probabilities."
        action={
          <button className="btn btn-ghost !text-xs" onClick={() => setShowHow((s) => !s)}>
            <Info size={13} /> How scoring works
          </button>
        }
      />

      {showHow && (
        <div className="card rise p-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          <p className="mb-2 font-semibold" style={{ color: "var(--text)" }}>
            Transparent scoring — weights
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            <li>· Timing urgency — {Math.round(SCORE_WEIGHTS.timing * 100)}% (peaks in the submission window)</li>
            <li>· Market relevance — {Math.round(SCORE_WEIGHTS.market * 100)}%</li>
            <li>· Seasonal demand evidence — {Math.round(SCORE_WEIGHTS.demand * 100)}%</li>
            <li>· Asset versatility — {Math.round(SCORE_WEIGHTS.versatility * 100)}%</li>
            <li>· Research confidence — {Math.round(SCORE_WEIGHTS.confidence * 100)}% (confirmed vs provisional dates)</li>
          </ul>
          <p className="mt-2 text-xs">
            ⭐⭐⭐ Critical ≥ 80 · ⭐⭐ High ≥ 60 · ⭐ Recommended ≥ 40. Planning windows: research
            120–150 days out, production 90–120, submission 60–90, late 30–60, last chance 0–30.
          </p>
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
          Today
        </button>
        <span className="mx-1 hidden h-6 w-px sm:block" style={{ background: "var(--line)" }} />
        <label className="relative min-w-[160px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input className="input !pl-9" placeholder="Search opportunities…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="input !w-auto" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
          <option value="">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
        <select className="input !w-auto" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select className="input !w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All types</option>
          {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>
        <select className="input !w-auto" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
          <option value="">All priorities</option>
          {ALL_PRIORITIES.map((p) => (
            <option key={p} value={p} className="capitalize">{p}</option>
          ))}
        </select>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            onClick={() => { setQuery(""); setCountry(""); setRegion(""); setCategory(""); setPriority(""); setStatus(""); }}
          >
            Clear
          </button>
        )}
      </div>

      <p className="text-sm" style={{ color: "var(--muted)" }}>
        <strong style={{ color: "var(--text)" }} className="tabular-nums">{opportunities.length}</strong> opportunities ranked for this date.
      </p>

      {opportunities.length === 0 ? (
        <EmptyState title="No opportunities match" hint="Loosen the filters or pick another planning date." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {opportunities.map((opp) => (
            <OpportunityCard key={`${opp.event.id}-${opp.year}`} opp={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
