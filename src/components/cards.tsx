"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Heart,
  ListPlus,
  MapPin,
} from "lucide-react";
import { assetCategoryById, countryByCode } from "@/lib/data";
import { formatLong } from "@/lib/date-engine";
import { PRIORITY_META } from "@/lib/recommendation-engine";
import { useDaysLabel, useLang } from "@/i18n/LanguageContext";
import type { EventOccurrence, Opportunity } from "@/types/event";
import { oppKey, useCollections } from "./collections";
import { CategoryBadge, DateStatusNote, PriorityBadge, ScoreBar, StatusBadge } from "./ui";

function CountryFlags({ codes, max = 6 }: { codes: string[]; max?: number }) {
  const shown = codes.slice(0, max);
  return (
    <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
      <MapPin size={12} />
      <span title={codes.map((c) => countryByCode[c]?.name ?? c).join(", ")}>
        {shown.map((c) => countryByCode[c]?.flag ?? c).join(" ")}
        {codes.length > max ? ` +${codes.length - max}` : ""}
      </span>
    </span>
  );
}

export function ActionButtons({ eventId, year, compact = false }: { eventId: string; year: number; compact?: boolean }) {
  const { favorites, toggleFavorite, completed, toggleCompleted, productionList, toggleProduction } = useCollections();
  const { t } = useLang();
  const key = oppKey(eventId, year);
  const fav = favorites.includes(eventId);
  const done = completed.includes(key);
  const inProd = productionList.includes(eventId);

  const btn = "btn btn-ghost !px-2.5 !py-1.5 !text-xs";
  return (
    <div className="flex flex-wrap gap-1.5 no-print">
      <button className={btn} onClick={() => toggleFavorite(eventId)} title={fav ? t.cards.favorited : t.cards.favorite} aria-pressed={fav}>
        <Heart size={13} fill={fav ? "var(--gold)" : "none"} color={fav ? "var(--gold)" : "currentColor"} />
        {!compact && (fav ? t.cards.favorited : t.cards.favorite)}
      </button>
      <button className={btn} onClick={() => toggleCompleted(key)} title={done ? t.cards.completed : t.cards.complete} aria-pressed={done}>
        <Check size={13} color={done ? "var(--ok)" : "currentColor"} />
        {!compact && (done ? t.cards.completed : t.cards.complete)}
      </button>
      <button className={btn} onClick={() => toggleProduction(eventId)} title={inProd ? t.cards.inProduction : t.cards.prodList} aria-pressed={inProd}>
        <ListPlus size={13} />
        {!compact && (inProd ? t.cards.inProduction : t.cards.prodList)}
      </button>
      <Link href={`/events/${eventId}`} className={btn}>
        {t.cards.details} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

export function EventCard({ occ, compact = false }: { occ: EventOccurrence; compact?: boolean }) {
  const e = occ.event;
  const { t } = useLang();
  const daysLabel = useDaysLabel();
  return (
    <article className="card card-hover flex flex-col gap-2.5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={occ.status} />
        <CategoryBadge category={e.category} />
        <DateStatusNote status={e.dateStatus} />
      </div>
      <div>
        <Link href={`/events/${e.id}`} className="font-serif-d text-[17px] font-semibold leading-snug hover:underline">
          {e.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]" style={{ color: "var(--muted)" }}>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={13} /> {formatLong(occ.date)}
            {occ.endDate && occ.endDate !== occ.date ? ` – ${formatLong(occ.endDate)}` : ""}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--text)" }}>
            <Clock size={13} /> {daysLabel(occ.daysUntil)}
          </span>
          <CountryFlags codes={e.countries} />
        </div>
      </div>
      {!compact && (
        <>
          <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.stage[occ.stage] ?? occ.stage} · {t.cards.createFrom}{" "}
            <strong style={{ color: "var(--text)" }}>{occ.creationStart}</strong>, {t.cards.uploadArrow}{" "}
            <strong style={{ color: "var(--text)" }}>{occ.submissionStart}</strong> → <strong style={{ color: "var(--text)" }}>{occ.submissionDeadline}</strong>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {e.assetSuggestions.slice(0, 3).map((s) => (
              <span key={s} className="chip !text-[11px]">
                {s}
              </span>
            ))}
          </div>
        </>
      )}
      <div className="mt-auto pt-1">
        <ActionButtons eventId={e.id} year={occ.year} compact={compact} />
      </div>
    </article>
  );
}

export function OpportunityCard({ opp }: { opp: Opportunity }) {
  const meta = PRIORITY_META[opp.priority];
  const e = opp.event;
  const { t } = useLang();
  const daysLabel = useDaysLabel();
  return (
    <article className="card card-hover flex flex-col gap-3 p-4 sm:p-5" style={{ borderTop: `3px solid ${meta.color}` }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PriorityBadge priority={opp.priority} />
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {t.cards.priorityScore}
          </span>
          <span className="font-serif-d text-2xl font-bold tabular-nums" style={{ color: meta.color }}>
            {opp.score.total}
          </span>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/events/${e.id}`} className="font-serif-d text-lg font-semibold leading-snug hover:underline">
            {e.name}
          </Link>
          <StatusBadge status={opp.status} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]" style={{ color: "var(--muted)" }}>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={13} /> {formatLong(opp.date)}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold" style={{ color: "var(--text)" }}>
            <Clock size={13} /> {daysLabel(opp.daysUntil)}
          </span>
          <CountryFlags codes={e.countries} />
          <DateStatusNote status={e.dateStatus} />
        </div>
      </div>

      <p className="rounded-lg px-3 py-2 text-[13px] leading-relaxed" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
        <strong style={{ color: "var(--text)" }}>{t.cards.whyNow} </strong>
        {opp.reason}
      </p>

      <div className="grid gap-1.5 sm:grid-cols-2">
        <ScoreBar label={t.cards.sbTiming} value={opp.score.timing} color="#D6A84F" />
        <ScoreBar label={t.cards.sbMarket} value={opp.score.market} color="#4D8DCE" />
        <ScoreBar label={t.cards.sbDemand} value={opp.score.demand} color="#2F9E6E" />
        <ScoreBar label={t.cards.sbVers} value={opp.score.versatility} color="#7B6FD0" />
        <div className="sm:col-span-2">
          <ScoreBar label={t.cards.sbConf} value={opp.score.confidence} color="#8B95AB" />
        </div>
      </div>

      <div>
        <p className="label mb-1.5">{t.cards.recAssets}</p>
        <div className="flex flex-wrap gap-1.5">
          {opp.event.assetTypes.slice(0, 8).map((at) => (
            <span key={at} className="chip !text-[11px]">
              {assetCategoryById[at]?.name ?? at}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto border-t pt-3" style={{ borderColor: "var(--line)" }}>
        <ActionButtons eventId={e.id} year={opp.year} />
      </div>
    </article>
  );
}
