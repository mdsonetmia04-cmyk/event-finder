"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  AlarmClock,
  ArrowRight,
  Check,
  ListChecks,
  PenTool,
  Plus,
  Search,
  UploadCloud,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { EventCard } from "./cards";
import type { EventOccurrence } from "@/types/event";

/* ---------------- Section wrapper: eyebrow + title + hairline ---------------- */

export function Section({
  eyebrow,
  title,
  sub,
  action,
  children,
  divide = true,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
  divide?: boolean;
}) {
  return (
    <section className="section">
      {divide && <hr className="section-divide mb-8" />}
      <div className="section-head">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
            <h2 className="section-title">{title}</h2>
            {sub && <p className="section-sub">{sub}</p>}
          </div>
          {action}
        </div>
      </div>
      {children}
    </section>
  );
}

/* ---------------- Hero accent helper ---------------- */

export function AccentLine({ line, accent }: { line: string; accent: string }) {
  const idx = line.indexOf(accent);
  if (idx < 0) return <>{line}</>;
  return (
    <>
      {line.slice(0, idx)}
      <span className="accent">{accent}</span>
      {line.slice(idx + accent.length)}
    </>
  );
}

/* ---------------- How it works ---------------- */

const STEP_ICONS = [Search, PenTool, UploadCloud];

export function HowItWorks() {
  const { t } = useLang();
  const s = t.sec.how;
  return (
    <Section eyebrow={s.eyebrow} title={s.title} sub={s.sub}>
      <div className="grid gap-4 md:grid-cols-3">
        {s.steps.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? Search;
          return (
            <div key={step.t} className="step-card">
              <div className="flex items-start justify-between">
                <span className="step-num">0{i + 1}</span>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "color-mix(in srgb, var(--gold) 14%, transparent)", color: "var(--gold-deep)" }}
                >
                  <Icon size={19} />
                </span>
              </div>
              <h3 className="font-serif-d mt-3 text-xl font-semibold">{step.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {step.d}
              </p>
              <span className="step-time">{step.time}</span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ---------------- Deadlines (next 14 days) ---------------- */

export function Deadlines({ occurrences }: { occurrences: EventOccurrence[] }) {
  const { t } = useLang();
  const s = t.sec.deadlines;
  const urgent = occurrences
    .filter((o) => o.daysUntil >= 0 && o.daysUntil <= 14 && (o.status === "LAST CHANCE" || o.status === "UPLOAD NOW"))
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 4);

  return (
    <Section
      eyebrow={s.eyebrow}
      title={s.title}
      sub={s.sub}
      action={
        <Link href="/opportunities" className="btn btn-ghost !text-xs">
          {s.viewAll} <ArrowRight size={13} />
        </Link>
      }
    >
      {urgent.length === 0 ? (
        <div className="card flex items-center gap-3 p-5">
          <AlarmClock size={22} style={{ color: "var(--gold-deep)" }} />
          <div>
            <p className="font-semibold">{s.emptyT}</p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{s.emptyH}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {urgent.map((o) => (
            <div key={`${o.event.id}-${o.year}`} className="relative">
              <span
                className="absolute -top-2.5 left-4 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: "#C0524D", color: "#fff" }}
              >
                {s.dueIn(o.daysUntil)}
              </span>
              <EventCard occ={o} compact />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------------- Upload checklist ---------------- */

const CHECK_KEY = "ssi-upload-checklist";

export function UploadChecklist() {
  const { t } = useLang();
  const s = t.sec.checklist;
  const [checked, setChecked] = useState<boolean[]>(() => s.items.map(() => false));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECK_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as boolean[];
        if (Array.isArray(arr) && arr.length === s.items.length) setChecked(arr);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (i: number) => {
    setChecked((c) => {
      const next = c.map((v, j) => (j === i ? !v : v));
      try {
        localStorage.setItem(CHECK_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const reset = () => {
    const next = s.items.map(() => false);
    setChecked(next);
    try {
      localStorage.setItem(CHECK_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const allDone = checked.every(Boolean);

  return (
    <Section
      eyebrow={s.eyebrow}
      title={s.title}
      sub={s.sub}
      divide={false}
      action={
        <button className="btn btn-ghost !text-xs" onClick={reset}>
          {s.reset}
        </button>
      }
    >
      <div className="grid gap-2.5">
        {s.items.map((item, i) => (
          <button
            key={item}
            onClick={() => toggle(i)}
            aria-pressed={checked[i]}
            className={`check-item text-left ${checked[i] ? "done" : ""}`}
          >
            <span className="check-box">{checked[i] && <Check size={14} strokeWidth={3} />}</span>
            <span>{item}</span>
          </button>
        ))}
      </div>
      {allDone && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: "color-mix(in srgb, var(--ok) 12%, transparent)", color: "var(--ok)" }}>
          <Check size={15} strokeWidth={3} /> {s.done}
        </p>
      )}
    </Section>
  );
}

/* ---------------- FAQ ---------------- */

export function Faq() {
  const { t } = useLang();
  const s = t.sec.faq;
  return (
    <Section eyebrow={s.eyebrow} title={s.title} sub={s.sub} divide={false}>
      <div className="grid gap-2.5">
        {s.items.map((f) => (
          <details key={f.q} className="faq-item">
            <summary>
              {f.q}
              <span className="faq-plus"><Plus size={14} /></span>
            </summary>
            <p className="faq-a">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export { ListChecks as ChecklistIcon };
