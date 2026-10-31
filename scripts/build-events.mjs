// Builds src/data/events.json + src/data/meta.json from scripts/event-defs.mjs.
// Usage: npm run build:data
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { EVENT_DEFS } from "./event-defs.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const YEARS = [2026, 2027, 2028];
const RESEARCH_DATE = "2026-10-31";

function readJSON(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

const countries = readJSON(join(root, "src/data/countries.json"));
const countryByCode = Object.fromEntries(countries.map((c) => [c.code, c]));

/* ---- variable dates: research overrides fallback ---- */
const fallback = readJSON(join(root, "scripts/fallback-dates.json"));
let research = {};
const researchPath = join(root, "research/variable-dates.json");
if (existsSync(researchPath)) {
  try {
    const arr = readJSON(researchPath);
    for (const e of arr) {
      if (e.key || e.event) {
        const key = e.key || slugify(e.event);
        research[key] = e;
      }
    }
    console.log(`Loaded ${Object.keys(research).length} researched variable dates`);
  } catch (err) {
    console.warn("Could not parse research/variable-dates.json, using fallback only:", err.message);
  }
} else {
  console.log("No research/variable-dates.json yet — using fallback dates (provisional).");
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Resolve a variable key -> { dates: {2026,2027,2028}, endDates?, status, calendarType } */
function varEntry(key) {
  const r = research[key];
  const f = fallback[key];
  if (!r && !f) throw new Error(`Unknown variable date key: ${key}`);
  const dates = {};
  const endDates = {};
  let status = "confirmed";
  let calendarType = "gregorian";
  for (const y of YEARS) {
    const ys = String(y);
    const rd = r?.dates?.[ys];
    const fd = f?.dates?.[ys];
    if (rd) {
      dates[ys] = rd;
      if (r.dateStatus === "provisional" || r.dateStatus === "unverified") status = "provisional";
    } else if (fd) {
      dates[ys] = fd;
      if (f.status === "provisional") status = "provisional";
    }
    const rde = r?.endDates?.[ys];
    const fde = f?.endDates?.[ys];
    if (rde) endDates[ys] = rde;
    else if (fde) endDates[ys] = fde;
  }
  calendarType = r?.calendarType || f?.calendarType || "gregorian";
  return { dates, endDates, status, calendarType };
}

function addDaysISO(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function validISO(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

/* ---- expansion ---- */
const seen = new Set();
const events = [];
const warnings = [];

for (const def of EVENT_DEFS) {
  if (seen.has(def.id)) throw new Error(`Duplicate event id: ${def.id}`);
  seen.add(def.id);

  const dates = {};
  const endDates = {};
  let status = def.dstatus || "confirmed";
  let calendarType = def.cal || "gregorian";

  if (def.md) {
    for (const y of YEARS) {
      dates[String(y)] = `${y}-${def.md}`;
      if (def.dur && def.dur > 1) endDates[String(y)] = addDaysISO(dates[String(y)], def.dur - 1);
    }
  } else if (def.v) {
    const ve = varEntry(def.v);
    if (ve.status === "provisional") status = "provisional";
    if (def.cal) calendarType = def.cal; else calendarType = ve.calendarType;
    for (const y of YEARS) {
      const ys = String(y);
      const base = ve.dates[ys];
      if (!base) {
        warnings.push(`${def.id}: no date for ${y}`);
        continue;
      }
      dates[ys] = def.vOff ? addDaysISO(base, def.vOff) : base;
      if (def.vEnd) {
        const veEnd = varEntry(def.vEnd);
        if (veEnd.dates[ys]) endDates[ys] = veEnd.dates[ys];
      } else if (ve.endDates[ys] && !def.vOff) {
        endDates[ys] = ve.endDates[ys];
      } else if (def.dur && def.dur > 1) {
        endDates[ys] = addDaysISO(dates[ys], def.dur - 1);
      }
    }
  } else {
    throw new Error(`Event ${def.id} has neither md nor v`);
  }

  for (const ys of Object.keys(dates)) {
    if (!validISO(dates[ys])) throw new Error(`Invalid date ${dates[ys]} for ${def.id}`);
  }

  const regions = [...new Set(def.countries.map((c) => countryByCode[c]?.region).filter(Boolean))];
  const unknown = def.countries.filter((c) => !countryByCode[c]);
  if (unknown.length) warnings.push(`${def.id}: unknown country codes ${unknown.join(",")}`);

  events.push({
    id: def.id,
    name: def.name,
    category: def.cat,
    description: def.desc,
    culturalBackground: def.bg,
    commercialRelevance: def.comm,
    dates,
    ...(Object.keys(endDates).length ? { endDates } : {}),
    countries: def.countries,
    regions,
    assetSuggestions: def.assets || [],
    designThemes: def.themes || [],
    buyerIndustries: def.industries || [],
    visualConcepts: def.visuals || [],
    keywordIdeas: def.keywords || [],
    creationLeadDays: def.lead?.[0] ?? 150,
    submissionLeadDays: def.lead?.[1] ?? 90,
    submissionDeadlineDays: def.lead?.[2] ?? 30,
    marketRelevance: def.rel ?? 3,
    seasonalDemand: def.dem ?? 3,
    researchConfidence: def.conf ?? 3,
    dateStatus: status,
    calendarType,
    sources: (def.src || []).map(([url, label]) => ({ url, label })),
    lastVerified: RESEARCH_DATE,
  });
}

/* assetTypes: map each event to the 13 canonical asset category ids via keyword matching */
const assetCats = readJSON(join(root, "src/data/asset-categories.json")).map((a) => a.id);
const ASSET_MATCH = [
  [/vector|icon|pattern|eps|svg|ai file|sticker|badge|template/i, ["vector-eps", "vector-svg", "vector-ai", "icons", "stickers", "patterns", "templates", "illustrations"]],
  [/photo/i, ["photo-jpg", "photo-png", "backgrounds"]],
  [/illustration/i, ["illustrations", "editorial"]],
  [/template/i, ["templates"]],
  [/video/i, ["video"]],
];
for (const e of events) {
  const hay = [...e.assetSuggestions, ...e.designThemes].join(" ").toLowerCase();
  const matched = new Set();
  for (const [re, ids] of ASSET_MATCH) {
    if (re.test(hay)) ids.forEach((i) => matched.add(i));
  }
  // sensible defaults so every event has coverage
  ["vector-eps", "illustrations", "photo-jpg", "templates"].forEach((i) => matched.add(i));
  e.assetTypes = [...matched].filter((i) => assetCats.includes(i));
}

events.sort((a, b) => a.name.localeCompare(b.name));

const outDir = join(root, "src/data");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "events.json"), JSON.stringify(events, null, 1) + "\n");

const meta = {
  lastResearchUpdate: RESEARCH_DATE,
  eventCount: events.length,
  countryCount: countries.length,
  years: YEARS,
  disclaimer:
    "Seasonal recommendations are research-based planning guidance. Adobe Stock download demand, ranking and sales performance are not guaranteed.",
};
writeFileSync(join(outDir, "meta.json"), JSON.stringify(meta, null, 1) + "\n");

console.log(`Wrote ${events.length} events, ${countries.length} countries.`);
if (warnings.length) {
  console.log("Warnings:");
  warnings.forEach((w) => console.log(" -", w));
}
