"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AlarmClock, ArrowRight, Check, ListChecks } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { CheckDraw, Expand, Pressable } from "./motion";
import { EventCard } from "./cards";
import type { EventOccurrence } from "@/types/event";

/* ---------------- Section wrapper: plain heading, generous air ---------------- */

export function Section({
  title,
  sub,
  action,
  children,
}: {
  title: string;
  sub?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className="section-title">{title}</h2>
          {sub && <p className="section-sub">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ---------------- How it works: a real ordered list ---------------- */

export function HowItWorks() {
  const { t } = useLang();
  const s = t.sec.how;
  return (
    <Section title={s.title} sub={s.sub}>
      <ol className="grid gap-4 md:grid-cols-3">
        {s.steps.map((step) => (
          <li
            key={step.t}
            className="rounded-2xl p-5"
            style={{ background: "var(--surface2)" }}
          >
            <h3 className="font-serif-d text-lg font-semibold">{step.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {step.d}
            </p>
            <p className="mt-3 text-xs font-medium tabular-nums" style={{ color: "var(--gold-deep)" }}>
              {step.time}
            </p>
          </li>
        ))}
      </ol>
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
      title={s.title}
      sub={s.sub}
      action={
        <Pressable>
          <Link href="/opportunities" className="btn btn-ghost !text-xs">
            {s.viewAll} <ArrowRight size={13} />
          </Link>
        </Pressable>
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
            <div className="relative pt-2.5" key={`${o.event.id}-${o.year}`}>
              <span
                className="absolute top-0 left-4 z-10 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
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
      title={s.title}
      sub={s.sub}
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
            className={`check-item w-full text-left ${checked[i] ? "done" : ""}`}
          >
            <span className="check-box">
              <CheckDraw checked={checked[i]} />
            </span>
            <span>{item}</span>
          </button>
        ))}
      </div>
      <Expand open={allDone}>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          style={{ background: "color-mix(in srgb, var(--ok) 12%, transparent)", color: "var(--ok)" }}>
          <Check size={15} strokeWidth={3} /> {s.done}
        </p>
      </Expand>
    </Section>
  );
}

/* ---------------- FAQ ---------------- */

export function Faq() {
  const { t } = useLang();
  const s = t.sec.faq;
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Section title={s.title} sub={s.sub}>
      <div className="grid gap-2.5">
        {s.items.map((f, i) => {
          const isOpen = open === i;
          return (
            <div className="faq-item" key={f.q}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-[1.15rem] py-4 text-left font-semibold text-[0.95rem]"
              >
                {f.q}
                <span className="faq-plus" style={{ transform: isOpen ? "rotate(45deg)" : undefined }}>
                  +
                </span>
              </button>
              <Expand open={isOpen}>
                <p className="faq-a">{f.a}</p>
              </Expand>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export { ListChecks as ChecklistIcon };
