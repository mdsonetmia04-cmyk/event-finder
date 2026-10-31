import {
  daysBetween,
  resolveOccurrenceDate,
  shiftDays,
} from "./date-engine";
import type {
  EventOccurrence,
  EventStatus,
  Opportunity,
  OpportunityScore,
  PrepStage,
  PriorityLabel,
  StockEvent,
} from "@/types/event";

/* ------------------------------------------------------------------ */
/* Planning windows (days before the event). Configurable per event.   */
/* ------------------------------------------------------------------ */

export const DEFAULT_WINDOWS = {
  research: [120, 150] as const, // early research & concept development
  production: [90, 120] as const, // main content production
  submission: [60, 90] as const, // recommended submission window
  late: [30, 60] as const, // late submission opportunity
  immediate: [0, 30] as const, // immediate / last-minute opportunity
};

export function getPrepStage(daysUntil: number): PrepStage {
  if (daysUntil < 0) return "completed";
  if (daysUntil <= 30) return "immediate";
  if (daysUntil <= 60) return "late";
  if (daysUntil <= 90) return "submission";
  if (daysUntil <= 120) return "production";
  if (daysUntil <= 180) return "research";
  return "upcoming";
}

export function getEventStatus(daysUntil: number): EventStatus {
  if (daysUntil < 0) return "COMPLETED";
  if (daysUntil <= 30) return "LAST CHANCE";
  if (daysUntil <= 60) return "HIGH PRIORITY";
  if (daysUntil <= 90) return "UPLOAD NOW";
  if (daysUntil <= 120) return "CREATE NOW";
  if (daysUntil <= 180) return "RESEARCH NOW";
  return "UPCOMING";
}

export const STAGE_LABEL: Record<PrepStage, string> = {
  research: "Early research & concept development",
  production: "Main content production",
  submission: "Recommended submission window",
  late: "Late submission opportunity",
  immediate: "Immediate / last-minute opportunity",
  completed: "Event passed — post-event & evergreen planning",
  upcoming: "Too early — monitor for now",
};

export const STAGE_COLOR: Record<PrepStage, string> = {
  research: "#4D8DCE",
  production: "#7B6FD0",
  submission: "#2F9E6E",
  late: "#C98A2B",
  immediate: "#C0524D",
  completed: "#7B8495",
  upcoming: "#7B8495",
};

export const STATUS_STYLE: Record<EventStatus, { bg: string; fg: string }> = {
  "RESEARCH NOW": { bg: "rgba(77,141,206,.14)", fg: "#4D8DCE" },
  "CREATE NOW": { bg: "rgba(123,111,208,.14)", fg: "#7B6FD0" },
  "UPLOAD NOW": { bg: "rgba(47,158,110,.14)", fg: "#2F9E6E" },
  "HIGH PRIORITY": { bg: "rgba(214,168,79,.16)", fg: "#A97F2C" },
  "UPCOMING": { bg: "rgba(123,132,149,.14)", fg: "#7B8495" },
  "LAST CHANCE": { bg: "rgba(192,82,77,.14)", fg: "#C0524D" },
  "COMPLETED": { bg: "rgba(123,132,149,.10)", fg: "#7B8495" },
};

/* ------------------------------------------------------------------ */
/* Occurrence resolution                                               */
/* ------------------------------------------------------------------ */

export function toOccurrence(
  event: StockEvent,
  selectedISO: string
): EventOccurrence | null {
  const resolved = resolveOccurrenceDate(event.dates, selectedISO);
  if (!resolved) return null;
  const daysUntil = daysBetween(selectedISO, resolved.date);
  const stage = getPrepStage(daysUntil);
  const status = getEventStatus(daysUntil);
  const endDate = event.endDates?.[String(resolved.year)];

  return {
    event,
    date: resolved.date,
    endDate,
    year: resolved.year,
    daysUntil,
    stage,
    status,
    creationStart: shiftDays(resolved.date, -event.creationLeadDays),
    submissionStart: shiftDays(resolved.date, -event.submissionLeadDays),
    submissionDeadline: shiftDays(resolved.date, -event.submissionDeadlineDays),
  };
}

/* ------------------------------------------------------------------ */
/* Priority scoring — transparent internal planning indicator.        */
/* Weights: timing 30% · market 25% · demand 20% · versatility 15% ·    */
/* confidence 10%. NOT a measured sales probability.                   */
/* ------------------------------------------------------------------ */

export const SCORE_WEIGHTS = {
  timing: 0.3,
  market: 0.25,
  demand: 0.2,
  versatility: 0.15,
  confidence: 0.1,
} as const;

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Timing urgency peaks around the submission window (~75 days out). */
export function timingScore(daysUntil: number): number {
  if (daysUntil < 0) return 5;
  if (daysUntil <= 120) {
    // peak at 75 days, taper to the edges of the 0..120 band
    return clamp100(100 - (Math.abs(daysUntil - 75) / 75) * 55);
  }
  if (daysUntil <= 180) return clamp100(45 - ((daysUntil - 120) / 60) * 30);
  return 10;
}

export function scoreOccurrence(occ: EventOccurrence): OpportunityScore {
  const timing = timingScore(occ.daysUntil);
  const market = clamp100((occ.event.marketRelevance / 5) * 100);
  const demand = clamp100((occ.event.seasonalDemand / 5) * 100);
  const versatility = clamp100(
    Math.min(occ.event.assetTypes.length, 8) / 8 * 100
  );
  const confidence =
    occ.event.dateStatus === "confirmed"
      ? 100
      : occ.event.dateStatus === "provisional"
        ? 55
        : 25;
  const total = clamp100(
    timing * SCORE_WEIGHTS.timing +
      market * SCORE_WEIGHTS.market +
      demand * SCORE_WEIGHTS.demand +
      versatility * SCORE_WEIGHTS.versatility +
      confidence * SCORE_WEIGHTS.confidence
  );
  return { total, timing, market, demand, versatility, confidence };
}

export function priorityLabel(total: number): PriorityLabel {
  if (total >= 80) return "critical";
  if (total >= 60) return "high";
  if (total >= 40) return "recommended";
  return "watch";
}

export const PRIORITY_META: Record<
  PriorityLabel,
  { stars: string; label: string; color: string }
> = {
  critical: { stars: "⭐⭐⭐", label: "Critical Priority", color: "#A97F2C" },
  high: { stars: "⭐⭐", label: "High Priority", color: "#C98A2B" },
  recommended: { stars: "⭐", label: "Recommended", color: "#4D8DCE" },
  watch: { stars: "", label: "Watch", color: "#7B8495" },
};

function buildReason(occ: EventOccurrence): string {
  const { event, daysUntil, stage } = occ;
  const bits: string[] = [];
  if (daysUntil >= 0 && daysUntil <= 90) {
    bits.push(
      `inside the ${stage === "immediate" ? "last-minute" : "active submission"} window (${daysUntil}d left)`
    );
  } else if (daysUntil > 90 && daysUntil <= 150) {
    bits.push(`in the prime creation window (${daysUntil}d left)`);
  }
  if (event.marketRelevance >= 4) bits.push("broad multi-market relevance");
  if (event.seasonalDemand >= 4) bits.push("strong seasonal demand evidence");
  if (event.assetTypes.length >= 5)
    bits.push(`versatile across ${event.assetTypes.length} asset types`);
  if (event.dateStatus !== "confirmed")
    bits.push("date is provisional — verify before final upload push");
  return bits.length > 0
    ? bits.join("; ") + "."
    : "Solid seasonal fit for a diversified portfolio.";
}

export function toOpportunity(occ: EventOccurrence): Opportunity {
  const score = scoreOccurrence(occ);
  return {
    ...occ,
    score,
    priority: priorityLabel(score.total),
    reason: buildReason(occ),
  };
}

/* ------------------------------------------------------------------ */
/* Collection helpers                                                  */
/* ------------------------------------------------------------------ */

export interface OpportunityFilters {
  countries?: string[];
  regions?: string[];
  categories?: string[];
  priorities?: PriorityLabel[];
  statuses?: EventStatus[];
  query?: string;
}

export function getAllOccurrences(
  events: StockEvent[],
  selectedISO: string
): EventOccurrence[] {
  const out: EventOccurrence[] = [];
  for (const e of events) {
    const occ = toOccurrence(e, selectedISO);
    if (occ) out.push(occ);
  }
  return out.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Star-marked opportunities: actionable, not completed, sorted by score. */
export function getOpportunities(
  events: StockEvent[],
  selectedISO: string,
  filters: OpportunityFilters = {},
  limit = 60
): Opportunity[] {
  const opps = getAllOccurrences(events, selectedISO)
    .filter((o) => o.daysUntil >= 0 && o.daysUntil <= 180)
    .map(toOpportunity);

  const f = filters;
  const filtered = opps.filter((o) => {
    if (f.countries?.length && !o.event.countries.some((c) => f.countries!.includes(c)))
      return false;
    if (f.regions?.length && !o.event.regions.some((r) => f.regions!.includes(r)))
      return false;
    if (f.categories?.length && !f.categories.includes(o.event.category)) return false;
    if (f.priorities?.length && !f.priorities.includes(o.priority)) return false;
    if (f.statuses?.length && !f.statuses.includes(o.status)) return false;
    if (f.query) {
      const q = f.query.toLowerCase();
      const hay = `${o.event.name} ${o.event.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return filtered
    .sort((a, b) => b.score.total - a.score.total || a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

/** Events needing attention right now, grouped by status. */
export function getActionGroups(
  events: StockEvent[],
  selectedISO: string
): Record<EventStatus, EventOccurrence[]> {
  const groups = {
    "RESEARCH NOW": [],
    "CREATE NOW": [],
    "UPLOAD NOW": [],
    "HIGH PRIORITY": [],
    "UPCOMING": [],
    "LAST CHANCE": [],
    "COMPLETED": [],
  } as Record<EventStatus, EventOccurrence[]>;
  for (const occ of getAllOccurrences(events, selectedISO)) {
    groups[occ.status].push(occ);
  }
  return groups;
}
