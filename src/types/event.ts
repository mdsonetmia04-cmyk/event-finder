/** Core domain types for StockSeason Intelligence */

export type DateStatus = "confirmed" | "provisional" | "unverified";

export type EventCategory =
  | "seasonal-holiday"
  | "shopping"
  | "cultural"
  | "religious"
  | "awareness"
  | "education"
  | "business"
  | "celebration"
  | "sports";

export interface EventSource {
  url: string;
  label: string;
}

/** One seasonal event with per-year country-specific dates. */
export interface StockEvent {
  id: string;
  name: string;
  category: EventCategory;
  description: string;
  culturalBackground: string;
  commercialRelevance: string;
  /** year -> ISO date (YYYY-MM-DD) of the event start */
  dates: Record<string, string>;
  /** year -> ISO date of the event end (multi-day events) */
  endDates?: Record<string, string>;
  /** ISO 3166-1 alpha-2 country codes where this event is relevant */
  countries: string[];
  regions: string[];
  assetTypes: string[];
  assetSuggestions: string[];
  designThemes: string[];
  buyerIndustries: string[];
  visualConcepts: string[];
  keywordIdeas: string[];
  /** planning lead times in days */
  creationLeadDays: number;
  submissionLeadDays: number;
  submissionDeadlineDays: number;
  /** 1..5 scales */
  marketRelevance: number;
  seasonalDemand: number;
  researchConfidence: number;
  dateStatus: DateStatus;
  calendarType: string;
  sources: EventSource[];
  lastVerified: string;
}

export type PrepStage =
  | "research"
  | "production"
  | "submission"
  | "late"
  | "immediate"
  | "completed"
  | "upcoming";

export type EventStatus =
  | "RESEARCH NOW"
  | "CREATE NOW"
  | "UPLOAD NOW"
  | "HIGH PRIORITY"
  | "UPCOMING"
  | "LAST CHANCE"
  | "COMPLETED";

export type PriorityLabel = "critical" | "high" | "recommended" | "watch";

export interface EventOccurrence {
  event: StockEvent;
  /** resolved ISO date for the relevant year */
  date: string;
  endDate?: string;
  year: number;
  daysUntil: number;
  stage: PrepStage;
  status: EventStatus;
  creationStart: string;
  submissionStart: string;
  submissionDeadline: string;
}

export interface OpportunityScore {
  total: number;
  timing: number;
  market: number;
  demand: number;
  versatility: number;
  confidence: number;
}

export interface Opportunity extends EventOccurrence {
  score: OpportunityScore;
  priority: PriorityLabel;
  reason: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  region: string;
  relevance: 1 | 2 | 3 | 4 | 5;
  shoppingPeriods: string[];
  designNotes: string;
  sectors: string[];
  confidence: string;
}

export interface AssetCategory {
  id: string;
  name: string;
  description: string;
}

export interface ProductionTask {
  id: string;
  title: string;
  eventId?: string;
  eventName?: string;
  assetCategory: string;
  targetQuantity: number;
  doneQuantity: number;
  startDate: string;
  deadline: string;
  status: "planned" | "in-progress" | "completed";
  notes: string;
  createdAt: string;
}

export interface DataMeta {
  lastResearchUpdate: string;
  eventCount: number;
  countryCount: number;
  years: number[];
  disclaimer: string;
}
