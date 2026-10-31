import { COUNTRIES, EVENTS } from "./data";
import type { StockEvent } from "@/types/event";

export interface ValidationIssue {
  level: "error" | "warning";
  eventId: string;
  message: string;
}

/** Validate the event database for structural problems. */
export function validateEvents(events: StockEvent[] = EVENTS): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const countryCodes = new Set(COUNTRIES.map((c) => c.code));

  for (const e of events) {
    if (!e.id) issues.push({ level: "error", eventId: "(missing)", message: "Missing id" });
    if (ids.has(e.id))
      issues.push({ level: "error", eventId: e.id, message: "Duplicate id" });
    ids.add(e.id);
    if (!e.name) issues.push({ level: "error", eventId: e.id, message: "Missing name" });

    const years = Object.keys(e.dates);
    if (years.length === 0)
      issues.push({ level: "error", eventId: e.id, message: "No dates" });
    for (const y of years) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.dates[y]))
        issues.push({ level: "error", eventId: e.id, message: `Bad date format for ${y}: ${e.dates[y]}` });
    }
    if (e.countries.length === 0)
      issues.push({ level: "warning", eventId: e.id, message: "No countries assigned" });
    for (const c of e.countries) {
      if (!countryCodes.has(c))
        issues.push({ level: "error", eventId: e.id, message: `Unknown country code ${c}` });
    }
    if (e.assetSuggestions.length === 0)
      issues.push({ level: "warning", eventId: e.id, message: "No asset suggestions" });
    if (e.keywordIdeas.length === 0)
      issues.push({ level: "warning", eventId: e.id, message: "No keyword ideas" });
    if (e.dateStatus === "provisional" && e.researchConfidence >= 4)
      issues.push({
        level: "warning",
        eventId: e.id,
        message: "Provisional date with high research confidence — recheck",
      });
    for (const s of [e.marketRelevance, e.seasonalDemand, e.researchConfidence]) {
      if (s < 1 || s > 5)
        issues.push({ level: "error", eventId: e.id, message: `Scale out of range: ${s}` });
    }
  }
  return issues;
}

/** Serialize events to CSV (for the admin export feature). */
export function eventsToCSV(events: StockEvent[] = EVENTS): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ["id", "name", "category", "date_2026", "date_2027", "date_2028", "countries", "date_status", "market_relevance", "seasonal_demand", "last_verified"].join(","),
  ];
  for (const e of events) {
    rows.push(
      [
        esc(e.id),
        esc(e.name),
        esc(e.category),
        esc(e.dates["2026"] ?? ""),
        esc(e.dates["2027"] ?? ""),
        esc(e.dates["2028"] ?? ""),
        esc(e.countries.join(";")),
        esc(e.dateStatus),
        esc(e.marketRelevance),
        esc(e.seasonalDemand),
        esc(e.lastVerified),
      ].join(",")
    );
  }
  return rows.join("\n");
}
