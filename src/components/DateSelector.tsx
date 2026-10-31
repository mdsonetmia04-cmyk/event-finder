"use client";

import { CalendarDays, RotateCcw } from "lucide-react";
import { addDays, addYears, format, startOfYear } from "date-fns";
import { isValidISODate, todayISO } from "@/lib/date-engine";
import { useLang } from "@/i18n/LanguageContext";

interface Props {
  date: string;
  onDateChange: (iso: string) => void;
  windowDays: number;
  onWindowChange: (days: number) => void;
}

const WINDOWS = [7, 30, 90];

export default function DateSelector({ date, onDateChange, windowDays, onWindowChange }: Props) {
  const today = todayISO();
  const { t } = useLang();

  const jump = (days: number) => {
    const d = addDays(new Date(date + "T12:00:00"), days);
    onDateChange(format(d, "yyyy-MM-dd"));
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays size={16} style={{ color: "var(--gold-deep)" }} />
          {t.dateSel.planningDate}
        </label>
        <input
          type="date"
          className="input !w-auto"
          value={date}
          min="2026-01-01"
          max="2028-12-31"
          onChange={(e) => {
            if (isValidISODate(e.target.value)) onDateChange(e.target.value);
          }}
          aria-label={t.dateSel.planningDate}
        />
        <div className="flex flex-wrap gap-1.5">
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => onDateChange(today)}>
            <RotateCcw size={12} /> {t.dateSel.today}
          </button>
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => jump(7)}>
            {t.dateSel.d7}
          </button>
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => jump(30)}>
            {t.dateSel.d30}
          </button>
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => jump(90)}>
            {t.dateSel.d90}
          </button>
          <button
            className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            onClick={() => onDateChange(format(startOfYear(new Date()), "yyyy-MM-dd"))}
          >
            {t.dateSel.curYear}
          </button>
          <button
            className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            onClick={() => onDateChange(format(startOfYear(addYears(new Date(), 1)), "yyyy-MM-dd"))}
          >
            {t.dateSel.nextYear}
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
        <span className="label">{t.dateSel.window}</span>
        <div className="flex gap-1.5">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => onWindowChange(w)}
              className={`btn !px-3 !py-1.5 !text-xs ${windowDays === w ? "btn-active" : "btn-ghost"}`}
            >
              {t.dateSel.nextDays(w)}
            </button>
          ))}
        </div>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {t.dateSel.windowHint}
        </span>
      </div>
    </div>
  );
}
