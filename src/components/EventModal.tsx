"use client";

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { useEffect } from "react";
import { assetCategoryById, countryByCode } from "@/lib/data";
import { formatLong } from "@/lib/date-engine";
import { STAGE_COLOR } from "@/lib/recommendation-engine";
import { useDaysLabel, useLang } from "@/i18n/LanguageContext";
import type { EventOccurrence } from "@/types/event";
import { ActionButtons } from "./cards";
import { CategoryBadge, DateStatusNote, StatusBadge } from "./ui";

export default function EventModal({ occ, onClose }: { occ: EventOccurrence | null; onClose: () => void }) {
  const { t } = useLang();
  const daysLabel = useDaysLabel();
  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  if (!occ) return null;
  const e = occ.event;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={e.name}
    >
      <div
        className="card max-h-[88vh] w-full max-w-2xl overflow-y-auto p-5 sm:rounded-2xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={occ.status} />
            <CategoryBadge category={e.category} />
            <DateStatusNote status={e.dateStatus} />
          </div>
          <button className="btn btn-ghost !px-2.5 !py-1.5" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <h3 className="font-serif-d text-2xl font-semibold">{e.name}</h3>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {formatLong(occ.date)}
          {occ.endDate && occ.endDate !== occ.date ? ` – ${formatLong(occ.endDate)}` : ""} ·{" "}
          <strong style={{ color: "var(--text)" }}>{daysLabel(occ.daysUntil)}</strong>
        </p>

        <div className="mt-4 rounded-xl p-3.5" style={{ background: "var(--surface2)" }}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="dot" style={{ background: STAGE_COLOR[occ.stage] }} />
            {t.stage[occ.stage] ?? occ.stage}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="label">{t.modal.createFrom}</p>
              <p className="mt-0.5 font-semibold">{occ.creationStart}</p>
            </div>
            <div>
              <p className="label">{t.modal.uploadFrom}</p>
              <p className="mt-0.5 font-semibold">{occ.submissionStart}</p>
            </div>
            <div>
              <p className="label">{t.modal.uploadBy}</p>
              <p className="mt-0.5 font-semibold">{occ.submissionDeadline}</p>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {e.description}
        </p>

        <div className="mt-3">
          <p className="label mb-1.5">{t.modal.relMarkets}</p>
          <div className="flex flex-wrap gap-1.5">
            {e.countries.map((c) => (
              <span key={c} className="chip !text-[11px]">
                {countryByCode[c]?.flag} {countryByCode[c]?.name ?? c}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <p className="label mb-1.5">{t.modal.topSuggest}</p>
          <ul className="grid gap-1 text-[13px] sm:grid-cols-2">
            {e.assetSuggestions.slice(0, 6).map((s) => (
              <li key={s} className="flex gap-1.5">
                <span style={{ color: "var(--gold-deep)" }}>•</span> {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3">
          <p className="label mb-1.5">{t.modal.assetTypes}</p>
          <div className="flex flex-wrap gap-1.5">
            {e.assetTypes.slice(0, 8).map((t) => (
              <span key={t} className="chip !text-[11px]">
                {assetCategoryById[t]?.name ?? t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ActionButtons eventId={e.id} year={occ.year} compact />
          <Link href={`/events/${e.id}`} className="btn btn-gold !text-xs">
            {t.modal.openFull} <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
