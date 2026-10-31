import { COUNTRIES, EVENTS, countryByCode } from "./data";
import { toOccurrence } from "./recommendation-engine";
import type { Country, EventOccurrence } from "@/types/event";

/** Upcoming occurrences for one country, nearest first. */
export function getCountryOccurrences(
  code: string,
  selectedISO: string,
  limit = 12
): EventOccurrence[] {
  return EVENTS.filter((e) => e.countries.includes(code))
    .map((e) => toOccurrence(e, selectedISO))
    .filter((o): o is EventOccurrence => !!o && o.daysUntil >= -30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, limit);
}

export interface CountryComparison {
  country: Country;
  occurrences: EventOccurrence[];
}

/** Side-by-side upcoming calendars for 2–4 countries. */
export function compareCountries(
  codes: string[],
  selectedISO: string,
  limit = 8
): CountryComparison[] {
  return codes
    .map((code) => countryByCode[code])
    .filter(Boolean)
    .map((country) => ({
      country,
      occurrences: getCountryOccurrences(country.code, selectedISO, limit),
    }));
}

export function relevanceLabel(level: number): string {
  return ["", "Niche", "Emerging", "Strong", "Major", "Flagship"][level] ?? "—";
}

export function countriesByRegion(): Record<string, Country[]> {
  const out: Record<string, Country[]> = {};
  for (const c of COUNTRIES) {
    (out[c.region] ??= []).push(c);
  }
  return out;
}
