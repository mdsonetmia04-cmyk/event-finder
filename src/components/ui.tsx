"use client";

import { AlertTriangle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/data";
import { PRIORITY_META, STATUS_STYLE } from "@/lib/recommendation-engine";
import type { EventCategory, EventStatus, PriorityLabel } from "@/types/event";

export function StatusBadge({ status }: { status: EventStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="chip !border-0 !py-1 text-[11px] font-bold tracking-wide"
      style={{ background: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}

export function PriorityBadge({ priority, showStars = true }: { priority: PriorityLabel; showStars?: boolean }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className="chip" style={{ borderColor: meta.color, color: meta.color }}>
      {showStars && meta.stars ? <span>{meta.stars}</span> : null}
      <span className="font-semibold">{meta.label}</span>
    </span>
  );
}

export function CategoryBadge({ category }: { category: EventCategory }) {
  const color = CATEGORY_COLOR[category];
  return (
    <span className="chip">
      <span className="dot" style={{ background: color }} />
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export function DateStatusNote({ status }: { status: "confirmed" | "provisional" | "unverified" }) {
  if (status === "confirmed") return null;
  return (
    <span className="chip" style={{ borderColor: "#C98A2B", color: "#C98A2B" }} title="Date may shift — verify before the final upload push">
      <AlertTriangle size={12} />
      {status === "provisional" ? "Provisional date" : "Unverified date"}
    </span>
  );
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-serif-d text-[22px] font-semibold tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <Inbox size={28} style={{ color: "var(--muted)" }} />
      <p className="font-medium">{title}</p>
      {hint && (
        <p className="max-w-sm text-sm" style={{ color: "var(--muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      <div className="progress flex-1">
        <div style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="w-8 text-right font-semibold tabular-nums">{value}</span>
    </div>
  );
}
