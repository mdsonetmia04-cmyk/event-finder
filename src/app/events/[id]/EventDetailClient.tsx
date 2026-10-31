"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Copy,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { ActionButtons } from "@/components/cards";
import { CategoryBadge, DateStatusNote, SectionHeader, StatusBadge } from "@/components/ui";
import { assetCategoryById, countryByCode } from "@/lib/data";
import { generateContentPlan, type ContentPlan } from "@/lib/content-plan";
import { daysBetween, formatLong, shiftDays, todayISO } from "@/lib/date-engine";
import { eventById } from "@/lib/data";
import {
  getEventStatus,
  getPrepStage,
  STAGE_COLOR,
  STAGE_LABEL,
} from "@/lib/recommendation-engine";
import type { EventOccurrence } from "@/types/event";

function yearOccurrence(eventId: string, year: number): EventOccurrence | null {
  const event = eventById[eventId];
  const date = event?.dates[String(year)];
  if (!event || !date) return null;
  const today = todayISO();
  const daysUntil = daysBetween(today, date);
  const endDate = event.endDates?.[String(year)];
  return {
    event,
    date,
    endDate,
    year,
    daysUntil,
    stage: getPrepStage(daysUntil),
    status: getEventStatus(daysUntil),
    creationStart: shiftDays(date, -event.creationLeadDays),
    submissionStart: shiftDays(date, -event.submissionLeadDays),
    submissionDeadline: shiftDays(date, -event.submissionDeadlineDays),
  };
}

function PlanSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-serif-d text-lg font-semibold">
        <span style={{ color: "var(--gold-deep)" }}>{icon}</span> {title}
      </h3>
      {children}
    </div>
  );
}

export default function EventDetailClient({ id }: { id: string }) {
  const event = eventById[id];
  const years = useMemo(
    () => Object.keys(event?.dates ?? {}).map(Number).sort(),
    [event]
  );
  const [year, setYear] = useState<number>(() => {
    const y = new Date().getFullYear();
    return years.includes(y) ? y : (years[0] ?? 2026);
  });
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [copied, setCopied] = useState(false);

  const occ = useMemo(() => (event ? yearOccurrence(event.id, year) : null), [event, year]);
  if (!event || !occ) return null;

  const copyPlan = async () => {
    if (!plan) return;
    const text = [
      `CONTENT PLAN — ${event.name} (${year})`,
      "",
      "CONCEPTS:",
      ...plan.concepts.map((c, i) => `${i + 1}. [${c.assetType}] ${c.title} — ${c.description} Composition: ${c.composition}`),
      "",
      "COLLECTION THEMES:",
      ...plan.collectionThemes.map((t) => `- ${t}`),
      "",
      "KEYWORD PLAN:",
      ...plan.keywordPlan.map((k) => `- ${k}`),
      "",
      "UPLOAD CHECKLIST:",
      ...plan.uploadChecklist.map((k) => `[ ] ${k}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/calendar" className="btn btn-ghost w-fit !text-xs no-print">
        <ArrowLeft size={13} /> Back to calendar
      </Link>

      {/* Header */}
      <div className="card p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={occ.status} />
          <CategoryBadge category={event.category} />
          <DateStatusNote status={event.dateStatus} />
        </div>
        <h1 className="font-serif-d mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{event.name}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: "var(--muted)" }}>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} />
            {formatLong(occ.date)}
            {occ.endDate && occ.endDate !== occ.date ? ` – ${formatLong(occ.endDate)}` : ""}
          </span>
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {occ.daysUntil < 0 ? `${Math.abs(occ.daysUntil)} days ago` : occ.daysUntil === 0 ? "Today" : `in ${occ.daysUntil} days`}
          </span>
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed" style={{ color: "var(--muted)" }}>{event.description}</p>

        {/* Year tabs */}
        <div className="mt-4 flex gap-1.5 no-print">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => { setYear(y); setPlan(null); }}
              className={`btn !px-4 !py-1.5 !text-xs ${year === y ? "btn-active" : "btn-ghost"}`}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Windows */}
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {[
            { label: "Start creating", value: occ.creationStart, hint: `${event.creationLeadDays}d before` },
            { label: "Start uploading", value: occ.submissionStart, hint: `${event.submissionLeadDays}d before` },
            { label: "Upload deadline", value: occ.submissionDeadline, hint: `${event.submissionDeadlineDays}d before` },
            { label: "Current stage", value: STAGE_LABEL[occ.stage].split("—")[0], hint: occ.status, color: STAGE_COLOR[occ.stage] },
          ].map((w) => (
            <div key={w.label} className="rounded-xl p-3" style={{ background: "var(--surface2)" }}>
              <p className="label">{w.label}</p>
              <p className="mt-1 text-[15px] font-bold" style={w.color ? { color: w.color } : {}}>{w.value}</p>
              <p className="text-[11px]" style={{ color: "var(--muted)" }}>{w.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 no-print">
          <ActionButtons eventId={event.id} year={occ.year} />
        </div>
      </div>

      {/* Research sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PlanSection title="Cultural background" icon={<Lightbulb size={18} />}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{event.culturalBackground}</p>
        </PlanSection>
        <PlanSection title="Commercial relevance" icon={<Sparkles size={18} />}>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{event.commercialRelevance}</p>
        </PlanSection>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <PlanSection title="Relevant markets" icon={<CalendarDays size={18} />}>
          <div className="flex flex-wrap gap-1.5">
            {event.countries.map((c) => (
              <Link key={c} href={`/markets?country=${c}`} className="chip hover:opacity-80 !text-[11px]">
                {countryByCode[c]?.flag} {countryByCode[c]?.name ?? c}
              </Link>
            ))}
          </div>
          <p className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>Regions: {event.regions.join(", ")}</p>
        </PlanSection>
        <PlanSection title="Buyer industries" icon={<Lightbulb size={18} />}>
          <ul className="grid gap-1 text-sm">
            {event.buyerIndustries.map((b) => (
              <li key={b} className="flex gap-1.5"><span style={{ color: "var(--gold-deep)" }}>•</span> {b}</li>
            ))}
          </ul>
        </PlanSection>
        <PlanSection title="Design themes" icon={<Sparkles size={18} />}>
          <div className="flex flex-wrap gap-1.5">
            {event.designThemes.map((t) => (
              <span key={t} className="chip !text-[11px]">{t}</span>
            ))}
          </div>
        </PlanSection>
      </div>

      <PlanSection title="Recommended asset types" icon={<Sparkles size={18} />}>
        <div className="flex flex-wrap gap-1.5">
          {event.assetTypes.map((t) => (
            <span key={t} className="chip" title={assetCategoryById[t]?.description}>
              {assetCategoryById[t]?.name ?? t}
            </span>
          ))}
        </div>
        <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {event.assetSuggestions.map((s) => (
            <li key={s} className="flex gap-1.5"><span style={{ color: "var(--gold-deep)" }}>•</span> {s}</li>
          ))}
        </ul>
      </PlanSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlanSection title="Visual concepts" icon={<Lightbulb size={18} />}>
          <ul className="grid gap-1.5 text-sm">
            {event.visualConcepts.map((v) => (
              <li key={v} className="flex gap-1.5"><span style={{ color: "var(--gold-deep)" }}>•</span> {v}</li>
            ))}
          </ul>
        </PlanSection>
        <PlanSection title="Keyword ideas" icon={<Lightbulb size={18} />}>
          <div className="flex flex-wrap gap-1.5">
            {event.keywordIdeas.map((k) => (
              <span key={k} className="chip !text-[11px]">{k}</span>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            Front-load the most buyer-relevant terms; keep titles specific and honest. Never stuff brand
            names or unrelated trending terms — Adobe's similar-content and spam policies penalize it.
          </p>
        </PlanSection>
      </div>

      {/* Content plan generator */}
      <div className="card p-5 sm:p-6" style={{ borderColor: "var(--gold)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-d text-xl font-semibold">Generate content plan</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              A practical production plan for {event.name} {year} — concepts, themes, keywords and an upload checklist.
            </p>
          </div>
          <div className="flex gap-2 no-print">
            {plan && (
              <button className="btn btn-ghost !text-xs" onClick={copyPlan}>
                <Copy size={13} /> {copied ? "Copied!" : "Copy plan"}
              </button>
            )}
            <button className="btn btn-gold" onClick={() => setPlan(generateContentPlan(occ))}>
              <Sparkles size={15} /> {plan ? "Regenerate" : "Generate content plan"}
            </button>
          </div>
        </div>

        {plan && (
          <div className="rise mt-5 flex flex-col gap-4">
            <div>
              <p className="label mb-2">Asset concepts ({plan.concepts.length})</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {plan.concepts.map((c, i) => (
                  <div key={i} className="rounded-xl border p-3.5" style={{ borderColor: "var(--line)", background: "var(--surface2)" }}>
                    <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--gold-deep)" }}>
                      {i + 1}. {c.assetType}
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-snug">{c.title}</p>
                    <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>{c.description}</p>
                    <p className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
                      <strong style={{ color: "var(--text)" }}>Composition:</strong> {c.composition}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <PlanSection title="Collection themes" icon={<Sparkles size={16} />}>
                <ul className="grid gap-1.5 text-sm">
                  {plan.collectionThemes.map((t) => (
                    <li key={t} className="flex gap-1.5"><CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "#2F9E6E" }} /> {t}</li>
                  ))}
                </ul>
              </PlanSection>
              <PlanSection title="Design direction" icon={<Lightbulb size={16} />}>
                <ul className="grid gap-1.5 text-sm">
                  {plan.designDirection.map((t) => (
                    <li key={t} className="flex gap-1.5"><span style={{ color: "var(--gold-deep)" }}>•</span> {t}</li>
                  ))}
                </ul>
              </PlanSection>
            </div>

            <PlanSection title="Keyword research plan" icon={<Lightbulb size={16} />}>
              <ul className="grid gap-1.5 text-sm">
                {plan.keywordPlan.map((t) => (
                  <li key={t} className="flex gap-1.5"><span style={{ color: "var(--gold-deep)" }}>•</span> {t}</li>
                ))}
              </ul>
            </PlanSection>

            <PlanSection title="Upload preparation checklist" icon={<CheckCircle2 size={16} />}>
              <ul className="grid gap-1.5 text-sm">
                {plan.uploadChecklist.map((t) => (
                  <li key={t} className="flex gap-1.5"><CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--steel)" }} /> {t}</li>
                ))}
              </ul>
            </PlanSection>

            <div className="rounded-xl border p-4" style={{ borderColor: "#C0524D55", background: "color-mix(in srgb, #C0524D 6%, transparent)" }}>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-bold" style={{ color: "#C0524D" }}>
                <ShieldAlert size={15} /> IP guardrails — do not generate
              </p>
              <ul className="grid gap-1 text-[13px]" style={{ color: "var(--muted)" }}>
                {plan.ipGuardrails.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Sources */}
      <div className="card p-5">
        <SectionHeader title="Research references" subtitle={`Last verified: ${event.lastVerified} · Calendar: ${event.calendarType}`} />
        {event.sources.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Standard public holiday calendar data. Verify dates against official sources before final upload pushes.
          </p>
        ) : (
          <ul className="grid gap-1.5 text-sm">
            {event.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: "var(--steel-deep)" }}>
                  {s.label}
                </a>
                <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>{s.url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
