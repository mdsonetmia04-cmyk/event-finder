"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, GitCompareArrows, Search } from "lucide-react";
import { EventCard } from "@/components/cards";
import { CountryFlag } from "@/components/CountryFlag";
import { SourcesPanel } from "@/components/SourcesPanel";
import { EmptyState, SectionHeader } from "@/components/ui";
import { COUNTRIES, countryByCode } from "@/lib/data";
import { formatMonthDay, todayISO } from "@/lib/date-engine";
import { useLang } from "@/i18n/LanguageContext";
import {
  compareCountries,
  countriesByRegion,
  getCountryOccurrences,
} from "@/lib/market-engine";

export default function MarketsPage() {
  const { t } = useLang();
  return (
    <Suspense fallback={<div className="card p-8 text-center text-sm" style={{ color: "var(--muted)" }}>{t.markets.loading}</div>}>
      <MarketsInner />
    </Suspense>
  );
}

function MarketsInner() {
  const params = useSearchParams();
  const { t } = useLang();
  const initial = params.get("country") ?? "";
  const [activeCode, setActiveCode] = useState(initial && countryByCode[initial] ? initial : "");
  const [query, setQuery] = useState("");
  const [compare, setCompare] = useState<string[]>([]);
  const [tab, setTab] = useState<"markets" | "sources">("markets");
  const today = todayISO();

  const byRegion = useMemo(countriesByRegion, []);
  const filteredRegions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return byRegion;
    const out: Record<string, typeof COUNTRIES> = {};
    for (const [r, list] of Object.entries(byRegion)) {
      const hit = list.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q);
      if (hit.length) out[r] = hit;
    }
    return out;
  }, [byRegion, query]);

  const active = activeCode ? countryByCode[activeCode] : null;
  const activeOcc = useMemo(
    () => (active ? getCountryOccurrences(active.code, today, 12) : []),
    [active, today]
  );

  const comparison = useMemo(
    () => (compare.length >= 2 ? compareCountries(compare, today, 8) : []),
    [compare, today]
  );

  const toggleCompare = (code: string) =>
    setCompare((list) =>
      list.includes(code) ? list.filter((c) => c !== code) : list.length >= 3 ? list : [...list, code]
    );

  return (
    <div className="flex flex-col gap-6">
      {!active ? (
        <>
          <div className="flex gap-2">
            {(
              [
                { id: "markets", label: t.markets.title },
                { id: "sources", label: t.sources.title },
              ] as const
            ).map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`btn !text-xs ${tab === tb.id ? "btn-gold" : "btn-ghost"}`}
              >
                {tb.label}
              </button>
            ))}
          </div>
          {tab === "markets" ? (
            <>
              <SectionHeader
                title={t.markets.title}
                subtitle={t.markets.sub(COUNTRIES.length)}
              />
          <div className="card flex items-center gap-2 p-3">
            <label className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input className="input !pl-9" placeholder={t.markets.searchPh} value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {compare.length > 0 && (
              <span className="chip">
                <GitCompareArrows size={12} /> {t.markets.selected(compare.length)}
              </span>
            )}
          </div>

          {comparison.length >= 2 && (
            <section className="card p-5">
              <h3 className="font-serif-d mb-1 text-lg font-semibold">{t.markets.countryComparison}</h3>
              <p className="mb-4 text-xs" style={{ color: "var(--muted)" }}>
                {t.markets.upcomingSide}
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                {comparison.map(({ country, occurrences }) => (
                  <div key={country.code}>
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <CountryFlag code={country.code} emoji={country.flag} size={20} /> {country.name}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {occurrences.length === 0 && (
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{t.markets.nothingUpcoming}</p>
                      )}
                      {occurrences.map((o) => (
                        <Link
                          key={`${o.event.id}-${o.year}`}
                          href={`/events/${o.event.id}`}
                          className="rounded-lg px-2.5 py-1.5 text-xs hover:opacity-80"
                          style={{ background: "var(--surface2)" }}
                        >
                          <span className="font-medium">{o.event.name}</span>
                          <span className="block" style={{ color: "var(--muted)" }}>
                            {formatMonthDay(o.date)} · {o.daysUntil}d · {t.status[o.status] ?? o.status}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost mt-4 !text-xs" onClick={() => setCompare([])}>
                {t.markets.clearComparison}
              </button>
            </section>
          )}

          {Object.entries(filteredRegions).map(([region, list]) => (
            <section key={region}>
              <h3 className="font-serif-d mb-3 text-lg font-semibold">{region}</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.map((c) => {
                  const upcoming = getCountryOccurrences(c.code, today, 1).length;
                  const inCompare = compare.includes(c.code);
                  return (
                    <div key={c.code} className="card card-hover p-4">
                      <div className="flex items-start justify-between">
                        <CountryFlag code={c.code} emoji={c.flag} size={30} />
                        <button
                          onClick={() => toggleCompare(c.code)}
                          className={`btn !px-2.5 !py-1 !text-[11px] ${inCompare ? "btn-active" : "btn-ghost"}`}
                          title={t.markets.compare}
                        >
                          <GitCompareArrows size={12} /> {inCompare ? t.markets.added : t.markets.compare}
                        </button>
                      </div>
                      <p className="mt-2 font-serif-d text-[16px] font-semibold">{c.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {t.markets.relLevels[c.relevance] ?? c.relevance} {t.markets.relevance} · {c.shoppingPeriods.length} {t.markets.shoppingPeriods}
                      </p>
                      <button
                        onClick={() => setActiveCode(c.code)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                        style={{ color: "var(--steel-deep)" }}
                      >
                        {t.markets.exploreMarket} <ArrowRight size={12} />
                      </button>
                      <p className="mt-1 hidden text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                        {upcoming > 0 ? "Has upcoming events" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
          {Object.keys(filteredRegions).length === 0 && (
            <EmptyState title={t.markets.noMarketsT} hint={t.markets.noMarketsH} />
          )}
            </>
          ) : (
            <SourcesPanel />
          )}
        </>
      ) : (
        <CountryDetail
          code={active!.code}
          occurrences={activeOcc}
          onBack={() => setActiveCode("")}
        />
      )}
    </div>
  );
}

function CountryDetail({
  code,
  occurrences,
  onBack,
}: {
  code: string;
  occurrences: ReturnType<typeof getCountryOccurrences>;
  onBack: () => void;
}) {
  const { t } = useLang();
  const c = countryByCode[code];
  return (
    <div className="flex flex-col gap-5">
      <button onClick={onBack} className="btn btn-ghost w-fit !text-xs">
        <ArrowLeft size={13} /> {t.markets.allMarkets}
      </button>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <CountryFlag code={c.code} emoji={c.flag} size={44} />
          <div>
            <h2 className="font-serif-d text-2xl font-semibold">{c.name}</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {c.region} · {t.markets.relLevels[c.relevance] ?? c.relevance} {t.markets.relevance}
            </p>
          </div>
          <div className="ml-auto flex gap-1" aria-label={`Relevance ${c.relevance} of 5`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className="h-2 w-6 rounded-full"
                style={{ background: i < c.relevance ? "var(--gold)" : "var(--line)" }}
              />
            ))}
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {c.designNotes}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <p className="label mb-2">{t.markets.keyShopping}</p>
            <ul className="grid gap-1 text-[13px]">
              {c.shoppingPeriods.map((s) => (
                <li key={s} className="flex gap-1.5"><span style={{ color: "var(--gold-deep)" }}>•</span> {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-2">{t.markets.sectors}</p>
            <ul className="grid gap-1 text-[13px]">
              {c.sectors.map((s) => (
                <li key={s} className="flex gap-1.5"><span style={{ color: "var(--steel)" }}>•</span> {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-2">{t.markets.researchConf}</p>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>{c.confidence}</p>
          </div>
        </div>
      </div>

      <SectionHeader
        title={t.markets.upcomingIn(c.name)}
        subtitle={t.markets.onHorizon(occurrences.length)}
      />
      {occurrences.length === 0 ? (
        <EmptyState title={t.markets.noUpcomingT} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {occurrences.map((o) => (
            <EventCard key={`${o.event.id}-${o.year}`} occ={o} compact />
          ))}
        </div>
      )}
    </div>
  );
}
