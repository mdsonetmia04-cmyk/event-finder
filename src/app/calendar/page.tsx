"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from "date-fns";
import { bn } from "date-fns/locale";
import EventModal from "@/components/EventModal";
import { EmptyState, SectionHeader } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  COUNTRIES,
  EVENTS,
  REGIONS,
} from "@/lib/data";
import { daysBetween, parseDay, toISO, todayISO } from "@/lib/date-engine";
import {
  getEventStatus,
  priorityLabel,
  timingScore,
  toOccurrence,
} from "@/lib/recommendation-engine";
import type { EventCategory, EventOccurrence, EventStatus, PriorityLabel } from "@/types/event";

type View = "month" | "week" | "day" | "year";

interface CalOcc extends EventOccurrence {
  rangeStart: string;
  rangeEnd: string;
}

/** All dated occurrences (every year in the DB), status relative to real today. */
function buildOccurrences(): CalOcc[] {
  const today = todayISO();
  const out: CalOcc[] = [];
  for (const e of EVENTS) {
    for (const year of Object.keys(e.dates)) {
      const date = e.dates[year];
      const endDate = e.endDates?.[year] ?? date;
      const daysUntil = daysBetween(today, date);
      out.push({
        event: e,
        date,
        endDate,
        year: Number(year),
        daysUntil,
        stage: daysUntil < 0 ? "completed" : daysUntil <= 30 ? "immediate" : daysUntil <= 60 ? "late" : daysUntil <= 90 ? "submission" : daysUntil <= 120 ? "production" : daysUntil <= 180 ? "research" : "upcoming",
        status: getEventStatus(daysUntil),
        creationStart: "",
        submissionStart: "",
        submissionDeadline: "",
        rangeStart: date,
        rangeEnd: endDate,
      });
    }
  }
  // fill planning windows properly
  for (const o of out) {
    const full = toOccurrence(o.event, today);
    if (full && full.date === o.date) {
      o.creationStart = full.creationStart;
      o.submissionStart = full.submissionStart;
      o.submissionDeadline = full.submissionDeadline;
    } else {
      const d = parseDay(o.date);
      o.creationStart = toISO(addDays(d, -o.event.creationLeadDays));
      o.submissionStart = toISO(addDays(d, -o.event.submissionLeadDays));
      o.submissionDeadline = toISO(addDays(d, -o.event.submissionDeadlineDays));
    }
  }
  return out;
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as EventCategory[];
const ALL_STATUSES: EventStatus[] = ["RESEARCH NOW", "CREATE NOW", "UPLOAD NOW", "HIGH PRIORITY", "UPCOMING", "LAST CHANCE", "COMPLETED"];
const ALL_PRIORITIES: PriorityLabel[] = ["critical", "high", "recommended", "watch"];

function inRange(o: CalOcc, start: string, end: string): boolean {
  return o.rangeStart <= end && o.rangeEnd >= start;
}

export default function CalendarPage() {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<CalOcc | null>(null);

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const { t, lang } = useLang();
  const locale = lang === "bn" ? bn : undefined;

  const all = useMemo(buildOccurrences, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((o) => {
      if (q && !`${o.event.name} ${o.event.description}`.toLowerCase().includes(q)) return false;
      if (country && !o.event.countries.includes(country)) return false;
      if (region && !o.event.regions.includes(region)) return false;
      if (category && o.event.category !== category) return false;
      if (status && o.status !== status) return false;
      if (priority) {
        const p = priorityLabel(
          Math.round(
            timingScore(o.daysUntil) * 0.3 +
              (o.event.marketRelevance / 5) * 100 * 0.25 +
              (o.event.seasonalDemand / 5) * 100 * 0.2 +
              (Math.min(o.event.assetTypes.length, 8) / 8) * 100 * 0.15 +
              (o.event.dateStatus === "confirmed" ? 100 : 55) * 0.1
          )
        );
        if (p !== priority) return false;
      }
      return true;
    });
  }, [all, query, country, region, category, status, priority]);

  const occOnDay = (dayISO: string) => filtered.filter((o) => o.rangeStart <= dayISO && o.rangeEnd >= dayISO);

  const nav = (dir: 1 | -1) => {
    if (view === "month") setCursor((c) => (dir > 0 ? addMonths(c, 1) : subMonths(c, 1)));
    else if (view === "year") setCursor((c) => (dir > 0 ? addYears(c, 1) : subYears(c, 1)));
    else setCursor((c) => addDays(c, dir * (view === "week" ? 7 : 1)));
  };

  const title =
    view === "month"
      ? format(cursor, "MMMM yyyy", { locale })
      : view === "year"
        ? format(cursor, "yyyy", { locale })
        : view === "week"
          ? format(startOfWeek(cursor, { weekStartsOn: 1 }), "MMMM d, yyyy", { locale })
          : format(cursor, "EEEE, MMMM d, yyyy", { locale });

  const resetFilters = () => {
    setQuery(""); setCountry(""); setRegion(""); setCategory(""); setStatus(""); setPriority("");
  };
  const hasFilters = query || country || region || category || status || priority;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title={t.cal.title}
        subtitle={t.cal.sub(filtered.length)}
      />

      {/* Controls */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="flex gap-1">
          <button className="btn btn-ghost !px-2.5 !py-1.5" onClick={() => nav(-1)} aria-label="Previous"><ChevronLeft size={16} /></button>
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => setCursor(new Date())}>{t.cal.today}</button>
          <button className="btn btn-ghost !px-2.5 !py-1.5" onClick={() => nav(1)} aria-label="Next"><ChevronRight size={16} /></button>
        </div>
        <h2 className="font-serif-d px-2 text-xl font-semibold">{title}</h2>
        <div className="ml-auto flex gap-1">
          {(["month", "week", "day", "year"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`btn !px-3 !py-1.5 !text-xs capitalize ${view === v ? "btn-active" : "btn-ghost"}`}
            >
              {t.cal[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <label className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input className="input !pl-9" placeholder={t.cal.searchPh} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <select className="input !w-auto" value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t.cal.allCountries}>
          <option value="">{t.cal.allCountries}</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
        <select className="input !w-auto" value={region} onChange={(e) => setRegion(e.target.value)} aria-label={t.cal.allRegions}>
          <option value="">{t.cal.allRegions}</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select className="input !w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t.cal.allTypes}>
          <option value="">{t.cal.allTypes}</option>
          {ALL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{t.category[c] ?? CATEGORY_LABEL[c]}</option>
          ))}
        </select>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t.cal.allStatuses}>
          <option value="">{t.cal.allStatuses}</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{t.status[s] ?? s}</option>
          ))}
        </select>
        <select className="input !w-auto" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label={t.cal.allPriorities}>
          <option value="">{t.cal.allPriorities}</option>
          {ALL_PRIORITIES.map((p) => (
            <option key={p} value={p} className="capitalize">{t.priority[p] ?? p}</option>
          ))}
        </select>
        {hasFilters && (
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={resetFilters}>
            {t.cal.clear}
          </button>
        )}
      </div>

      {/* Views */}
      {view === "month" && <MonthView cursor={cursor} occOnDay={occOnDay} onSelect={setSelected} onDayClick={(d) => { setCursor(d); setView("day"); }} />}
      {view === "week" && <WeekView cursor={cursor} occOnDay={occOnDay} onSelect={setSelected} />}
      {view === "day" && <DayView cursor={cursor} occOnDay={occOnDay} onSelect={setSelected} />}
      {view === "year" && <YearView cursor={cursor} occOnDay={occOnDay} onMonthClick={(m) => { setCursor(m); setView("month"); }} />}

      {/* Legend */}
      <div className="card flex flex-wrap gap-x-4 gap-y-1.5 p-3 text-xs" style={{ color: "var(--muted)" }}>
        {ALL_CATEGORIES.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="dot" style={{ background: CATEGORY_COLOR[c] }} /> {t.category[c] ?? CATEGORY_LABEL[c]}
          </span>
        ))}
      </div>

      <EventModal occ={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ---------------- Month ---------------- */

function MonthView({ cursor, occOnDay, onSelect, onDayClick }: {
  cursor: Date;
  occOnDay: (iso: string) => CalOcc[];
  onSelect: (o: CalOcc) => void;
  onDayClick: (d: Date) => void;
}) {
  const { t } = useLang();
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  const todayStr = toISO(new Date());

  return (
    <div className="card p-3">
      <div className="cal-grid mb-1.5">
        {t.cal.weekdays.map((d) => (
          <p key={d} className="label !text-[10px] py-1 text-center">{d}</p>
        ))}
      </div>
      <div className="cal-grid">
        {days.map((d) => {
          const iso = toISO(d);
          const occs = occOnDay(iso);
          const outside = !isSameMonth(d, cursor);
          return (
            <div key={iso} className={`cal-day ${outside ? "outside" : ""} ${iso === todayStr ? "today" : ""}`}>
              <button
                onClick={() => onDayClick(d)}
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold hover:opacity-70 ${isSameDay(d, new Date()) ? "text-white" : ""}`}
                style={isSameDay(d, new Date()) ? { background: "var(--gold)" } : { color: "var(--muted)" }}
              >
                {format(d, "d")}
              </button>
              <div className="flex flex-col gap-1">
                {occs.slice(0, 3).map((o) => (
                  <button
                    key={`${o.event.id}-${o.year}`}
                    onClick={() => onSelect(o)}
                    className="truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium hover:opacity-80"
                    style={{ background: `${CATEGORY_COLOR[o.event.category]}22`, color: "var(--text)", borderLeft: `3px solid ${CATEGORY_COLOR[o.event.category]}` }}
                    title={`${o.event.name} · ${o.date}`}
                  >
                    {o.event.name}
                  </button>
                ))}
                {occs.length > 3 && (
                  <span className="px-1 text-[10px]" style={{ color: "var(--muted)" }}>
                    {t.cal.more(occs.length - 3)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Week ---------------- */

function WeekView({ cursor, occOnDay, onSelect }: {
  cursor: Date;
  occOnDay: (iso: string) => CalOcc[];
  onSelect: (o: CalOcc) => void;
}) {
  const { t } = useLang();
  const start = startOfWeek(cursor, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="card grid gap-px overflow-hidden p-0 sm:grid-cols-7" style={{ background: "var(--line)" }}>
      {days.map((d) => {
        const iso = toISO(d);
        const occs = occOnDay(iso);
        return (
          <div key={iso} className="min-h-[220px] p-2.5" style={{ background: "var(--surface)" }}>
            <p className="label !text-[10px]">{format(d, "EEE")}</p>
            <p className={`font-serif-d text-lg font-semibold ${isSameDay(d, new Date()) ? "" : ""}`} style={isSameDay(d, new Date()) ? { color: "var(--gold-deep)" } : {}}>
              {format(d, "d")}
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {occs.length === 0 && <p className="text-[11px]" style={{ color: "var(--muted)" }}>—</p>}
              {occs.map((o) => (
                <button
                  key={`${o.event.id}-${o.year}`}
                  onClick={() => onSelect(o)}
                  className="rounded-lg border-l-[3px] p-2 text-left text-[11px] hover:opacity-80"
                  style={{ borderColor: CATEGORY_COLOR[o.event.category], background: "var(--surface2)" }}
                >
                  <span className="font-semibold leading-tight">{o.event.name}</span>
                  <span className="mt-0.5 block" style={{ color: "var(--muted)" }}>{t.status[o.status] ?? o.status}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Day ---------------- */

function DayView({ cursor, occOnDay, onSelect }: {
  cursor: Date;
  occOnDay: (iso: string) => CalOcc[];
  onSelect: (o: CalOcc) => void;
}) {
  const { t, lang } = useLang();
  const locale = lang === "bn" ? bn : undefined;
  const occs = occOnDay(toISO(cursor));
  if (occs.length === 0) {
    return <EmptyState title={t.cal.noEventsDay(format(cursor, "MMMM d, yyyy", { locale }))} hint={t.cal.noEventsH} />;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {occs.map((o) => (
        <button key={`${o.event.id}-${o.year}`} onClick={() => onSelect(o)} className="card card-hover p-4 text-left">
          <p className="flex items-center gap-2 text-[11px] font-bold" style={{ color: CATEGORY_COLOR[o.event.category] }}>
            <span className="dot" style={{ background: CATEGORY_COLOR[o.event.category] }} />
            {(t.category[o.event.category] ?? CATEGORY_LABEL[o.event.category]).toUpperCase()} · {t.status[o.status] ?? o.status}
          </p>
          <p className="font-serif-d mt-1.5 text-[17px] font-semibold leading-snug">{o.event.name}</p>
          <p className="mt-1 line-clamp-2 text-[13px]" style={{ color: "var(--muted)" }}>{o.event.description}</p>
          <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
            {t.cal.uploadWindow}: <strong style={{ color: "var(--text)" }}>{o.submissionStart} → {o.submissionDeadline}</strong>
          </p>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Year ---------------- */

function YearView({ cursor, occOnDay, onMonthClick }: {
  cursor: Date;
  occOnDay: (iso: string) => CalOcc[];
  onMonthClick: (d: Date) => void;
}) {
  const year = cursor.getFullYear();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, m) => {
        const monthDate = new Date(year, m, 1);
        const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
        const days: Date[] = [];
        for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
        const monthCount = days.filter((d) => isSameMonth(d, monthDate) && occOnDay(toISO(d)).length > 0).length;
        return (
          <button key={m} onClick={() => onMonthClick(monthDate)} className="card card-hover p-3 text-left">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-serif-d text-[15px] font-semibold">{format(monthDate, "MMMM")}</p>
              <span className="chip !px-2 !text-[10px] tabular-nums">{monthCount}d</span>
            </div>
            <div className="grid grid-cols-7 gap-[3px]">
              {days.map((d) => {
                const iso = toISO(d);
                const n = isSameMonth(d, monthDate) ? occOnDay(iso).length : 0;
                const top = n > 0 ? occOnDay(iso)[0] : null;
                return (
                  <span
                    key={iso}
                    className="flex aspect-square items-center justify-center rounded-[4px] text-[9px]"
                    style={{
                      background: n > 0 && top ? `${CATEGORY_COLOR[top.event.category]}33` : "transparent",
                      border: n > 0 ? `1px solid ${CATEGORY_COLOR[top!.event.category]}66` : "1px solid transparent",
                      color: "var(--muted)",
                      opacity: isSameMonth(d, monthDate) ? 1 : 0.25,
                    }}
                    title={n > 0 ? `${n} events` : undefined}
                  >
                    {format(d, "d")}
                  </span>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
