import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";

/** Parse an ISO date string (YYYY-MM-DD) as a local date at noon to avoid TZ drift. */
export function parseDay(iso: string): Date {
  const d = parseISO(iso);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function toISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISO(new Date());
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return isValid(parseDay(s));
}

/** Whole days from `from` until `to` (to - from). */
export function daysBetween(fromISO: string, toISODate: string): number {
  return differenceInCalendarDays(parseDay(toISODate), parseDay(fromISO));
}

export function shiftDays(iso: string, days: number): string {
  return toISO(addDays(parseDay(iso), days));
}

export function formatLong(iso: string): string {
  return format(parseDay(iso), "EEEE, MMMM d, yyyy");
}

export function formatShort(iso: string): string {
  return format(parseDay(iso), "MMM d, yyyy");
}

export function formatMonthDay(iso: string): string {
  return format(parseDay(iso), "MMM d");
}

/** Years the database covers for a given event (from its dates map). */
export function eventYears(dates: Record<string, string>): number[] {
  return Object.keys(dates)
    .map(Number)
    .filter((y) => !Number.isNaN(y))
    .sort((a, b) => a - b);
}

/**
 * Resolve which dated occurrence of an event is relevant for `selectedISO`.
 * Prefers the nearest upcoming occurrence; if none upcoming, takes the most
 * recent past occurrence (within reason) so it can be marked COMPLETED.
 */
export function resolveOccurrenceDate(
  dates: Record<string, string>,
  selectedISO: string
): { date: string; year: number } | null {
  const years = eventYears(dates);
  if (years.length === 0) return null;

  let upcoming: { date: string; year: number } | null = null;
  let latestPast: { date: string; year: number } | null = null;

  for (const y of years) {
    const d = dates[String(y)];
    if (!d || !isValidISODate(d)) continue;
    const diff = daysBetween(selectedISO, d);
    if (diff >= 0) {
      if (!upcoming || diff < daysBetween(selectedISO, upcoming.date)) {
        upcoming = { date: d, year: y };
      }
    } else {
      if (!latestPast || diff > daysBetween(selectedISO, latestPast.date)) {
        latestPast = { date: d, year: y };
      }
    }
  }
  return upcoming ?? latestPast;
}

/** Human label for days remaining. */
export function daysLabel(daysUntil: number): string {
  if (daysUntil < 0) return `${Math.abs(daysUntil)}d ago`;
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `in ${daysUntil}d`;
}
