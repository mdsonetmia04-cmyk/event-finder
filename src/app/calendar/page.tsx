"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  format,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subYears,
} from "date-fns";
import { bn } from "date-fns/locale";
import EventModal from "@/components/EventModal";
import { Expand, Pressable } from "@/components/motion";
import { EmptyState, SectionHeader } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import {
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
  const [showFilters, setShowFilters] = useState(false);

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
  const activeCount = [query, country, region, category, status, priority].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        title={t.cal.title}
        subtitle={t.cal.sub(filtered.length)}
      />

      {/* Controls: one clean bar */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <div className="flex gap-1">
          <button className="btn btn-ghost !px-2.5 !py-1.5" onClick={() => nav(-1)} aria-label="Previous"><ChevronLeft size={16} /></button>
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => setCursor(new Date())}>{t.cal.today}</button>
          <button className="btn btn-ghost !px-2.5 !py-1.5" onClick={() => nav(1)} aria-label="Next"><ChevronRight size={16} /></button>
        </div>
        <h2 className="font-serif-d px-2 text-xl font-semibold">{title}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input
              className="input !w-44 !pl-9 !py-1.5 !text-xs"
              placeholder={t.cal.searchPh}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex gap-1">
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
          <Pressable>
            <button
              className={`btn !px-3 !py-1.5 !text-xs ${showFilters ? "btn-active" : "btn-ghost"}`}
              onClick={() => setShowFilters((s) => !s)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={13} /> {t.cal.filters}
              {activeCount > 0 && <span className="chip !px-1.5 !py-0 !text-[10px] tabular-nums">{activeCount}</span>}
            </button>
          </Pressable>
        </div>
      </div>

      {/* Filters: collapsible */}
      <Expand open={showFilters}>
        <div className="card flex flex-wrap items-center gap-2 p-3">
          <select className="input !w-auto !text-xs" value={country} onChange={(e) => setCountry(e.target.value)} aria-label={t.cal.allCountries}>
            <option value="">{t.cal.allCountries}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
          <select className="input !w-auto !text-xs" value={region} onChange={(e) => setRegion(e.target.value)} aria-label={t.cal.allRegions}>
            <option value="">{t.cal.allRegions}</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select className="input !w-auto !text-xs" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t.cal.allTypes}>
            <option value="">{t.cal.allTypes}</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{t.category[c] ?? CATEGORY_LABEL[c]}</option>
            ))}
          </select>
          <select className="input !w-auto !text-xs" value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t.cal.allStatuses}>
            <option value="">{t.cal.allStatuses}</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{t.status[s] ?? s}</option>
            ))}
          </select>
          <select className="input !w-auto !text-xs" value={priority} onChange={(e) => setPriority(e.target.value)} aria-label={t.cal.allPriorities}>
            <option value="">{t.cal.allPriorities}</option>
            {ALL_PRIORITIES.map((p) => (
              <option key={p} value={p} className="capitalize">{t.priority[p] ?? p}</option>
            ))}
          </select>
          {activeCount > 0 && (
            <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={resetFilters}>
              {t.cal.clear} ({t.cal.activeFilters(activeCount)})
            </button>
          )}
        </div>
      </Expand>

      {/* Views */}
      {view === "month" && (
        <>
          <MonthView cursor={cursor} occOnDay={occOnDay} onDayClick={(d) => { setCursor(d); setView("day"); }} />
          <MonthTimeline cursor={cursor} occs={filtered} onSelect={setSelected} />
        </>
      )}
      {view === "week" && <WeekView cursor={cursor} occOnDay={occOnDay} onSelect={setSelected} />}
      {view === "day" && <DayView cursor={cursor} occOnDay={occOnDay} onSelect={setSelected} />}
      {view === "year" && <YearView cursor={cursor} occOnDay={occOnDay} onMonthClick={(m) => { setCursor(m); setView("month"); }} />}

      {/* Legend: minimal */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-1 text-xs" style={{ color: "var(--muted)" }}>
        <span className="inline-flex items-center gap-1.5"><span className="cal-dot" /> {t.cal.legendEvent}</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-[14px] w-[14px] rounded-full" style={{ border: "2px solid var(--gold)" }} /> {t.cal.today}
        </span>
        <span className="tl-key"><i className="k-win" /> {t.cal.uploadWindow}</span>
      </div>

      <EventModal occ={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/* ---------------- Month: quiet dot grid ---------------- */

function MonthView({ cursor, occOnDay, onDayClick }: {
  cursor: Date;
  occOnDay: (iso: string) => CalOcc[];
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
            <button
              key={iso}
              onClick={() => onDayClick(d)}
              className={`cal-day ${outside ? "outside" : ""} ${iso === todayStr ? "today" : ""}`}
              aria-label={`${format(d, "MMMM d")}, ${occs.length} events`}
            >
              <span className="cal-daynum">{format(d, "d")}</span>
              <span className="cal-dots">
                {occs.slice(0, 4).map((o) => (
                  <span key={`${o.event.id}-${o.year}`} className="cal-dot" />
                ))}
                {occs.length > 4 && <span className="cal-more">+{occs.length - 4}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Month timeline: the visual ---------------- */

function MonthTimeline({ cursor, occs, onSelect }: {
  cursor: Date;
  occs: CalOcc[];
  onSelect: (o: CalOcc) => void;
}) {
  const { t } = useLang();
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const dim = getDaysInMonth(cursor);
  const startISO = toISO(monthStart);
  const endISO = toISO(monthEnd);
  const todayISOstr = toISO(new Date());

  const rows = occs
    .filter((o) => inRange(o, startISO, endISO))
    .sort((a, b) => (a.rangeStart < b.rangeStart ? -1 : 1))
    .slice(0, 8);

  if (rows.length === 0) return null;

  const clampDay = (iso: string) => Math.min(Math.max(daysBetween(startISO, iso), 0), dim - 1);
  const span = (sISO: string, eISO: string) => {
    const s = clampDay(sISO);
    const e = clampDay(eISO);
    return { left: `${(s / dim) * 100}%`, width: `${Math.max(((e - s + 1) / dim) * 100, 1.2)}%` };
  };
  const ticks = [1, 8, 15, 22, dim].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-serif-d text-lg font-semibold">{t.cal.timelineT}</h3>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{t.cal.timelineSub}</p>
        </div>
        <div className="flex gap-4">
          <span className="tl-key"><i className="k-bar" /> {t.cal.legendEvent}</span>
          <span className="tl-key"><i className="k-win" /> {t.cal.uploadWindow}</span>
        </div>
      </div>
      <div>
        {rows.map((o) => {
          const bar = span(o.rangeStart, o.rangeEnd);
          const win = inRange(o, startISO, endISO) && o.submissionStart && o.submissionDeadline
            ? span(
                o.submissionStart < startISO ? startISO : o.submissionStart,
                o.submissionDeadline > endISO ? endISO : o.submissionDeadline
              )
            : null;
          const showWin = win && o.submissionStart <= endISO && o.submissionDeadline >= startISO;
          return (
            <div className="tl-row" key={`${o.event.id}-${o.year}`}>
              <button onClick={() => onSelect(o)} className="tl-name truncate text-left hover:underline" title={o.event.name}>
                {o.event.name}
              </button>
              <div className="tl-track">
                {showWin && <span className="tl-win" style={{ left: win.left, width: win.width }} />}
                <button
                  onClick={() => onSelect(o)}
                  className="tl-bar"
                  style={{ left: bar.left, width: bar.width }}
                  title={`${o.event.name}: ${o.rangeStart} → ${o.rangeEnd}`}
                  aria-label={o.event.name}
                />
                {todayISOstr >= startISO && todayISOstr <= endISO && (
                  <span className="tl-today" style={{ left: `${(clampDay(todayISOstr) / dim) * 100}%` }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="tl-row" aria-hidden="true">
        <span />
        <div className="tl-axis">
          {ticks.map((d) => (
            <span key={d} className="tl-tick" style={{ left: `${((d - 1) / dim) * 100}%` }}>{d}</span>
          ))}
        </div>
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
        const isToday = isSameDay(d, new Date());
        return (
          <div key={iso} className="min-h-[220px] p-2.5" style={{ background: "var(--surface)" }}>
            <p className="label !text-[10px]">{format(d, "EEE")}</p>
            <p className="font-serif-d text-lg font-semibold" style={isToday ? { color: "var(--gold-deep)" } : {}}>
              {format(d, "d")}
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {occs.length === 0 && <p className="text-[11px]" style={{ color: "var(--muted)" }}>—</p>}
              {occs.map((o) => (
                <button
                  key={`${o.event.id}-${o.year}`}
                  onClick={() => onSelect(o)}
                  className="rounded-lg p-2 text-left text-[11px] hover:opacity-80"
                  style={{ background: "var(--surface2)", borderLeft: "3px solid var(--gold)" }}
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
          <p className="flex items-center gap-2 text-[11px] font-bold">
            <span className="cal-dot" />
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

/* ---------------- Year: single-hue heatmap ---------------- */

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
                return (
                  <span
                    key={iso}
                    className="flex aspect-square items-center justify-center rounded-[4px] text-[9px]"
                    style={{
                      background: n > 0 ? "var(--gold)" : "transparent",
                      opacity: n > 0 ? 0.18 + Math.min(n, 4) * 0.2 : 1,
                      color: n > 2 ? "#fff" : "var(--muted)",
                    }}
                    title={n > 0 ? `${n} events` : undefined}
                  >
                    <span style={{ opacity: isSameMonth(d, monthDate) ? 1 : 0.3 }}>{format(d, "d")}</span>
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
