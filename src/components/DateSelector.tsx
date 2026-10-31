"use client";

import { CalendarDays, RotateCcw } from "lucide-react";
import { addDays, addYears, format, startOfYear } from "date-fns";
import { isValidISODate, todayISO } from "@/lib/date-engine";

interface Props {
  date: string;
  onDateChange: (iso: string) => void;
  windowDays: number;
  onWindowChange: (days: number) => void;
}

const WINDOWS = [7, 30, 90];

export default function DateSelector({ date, onDateChange, windowDays, onWindowChange }: Props) {
  const today = todayISO();

  const jump = (days: number) => {
    const d = addDays(new Date(date + "T12:00:00"), days);
    onDateChange(format(d, "yyyy-MM-dd"));
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays size={16} style={{ color: "var(--gold-deep)" }} />
          Planning date
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
          aria-label="Select planning date"
        />
        <div className="flex flex-wrap gap-1.5">
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => onDateChange(today)}>
            <RotateCcw size={12} /> Today
          </button>
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => jump(7)}>
            +7 days
          </button>
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => jump(30)}>
            +30 days
          </button>
          <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => jump(90)}>
            +90 days
          </button>
          <button
            className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            onClick={() => onDateChange(format(startOfYear(new Date()), "yyyy-MM-dd"))}
          >
            Current year
          </button>
          <button
            className="btn btn-ghost !px-3 !py-1.5 !text-xs"
            onClick={() => onDateChange(format(startOfYear(addYears(new Date(), 1)), "yyyy-MM-dd"))}
          >
            Next year
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3" style={{ borderColor: "var(--line)" }}>
        <span className="label">Upcoming window</span>
        <div className="flex gap-1.5">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => onWindowChange(w)}
              className={`btn !px-3 !py-1.5 !text-xs ${windowDays === w ? "btn-active" : "btn-ghost"}`}
            >
              Next {w} days
            </button>
          ))}
        </div>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          Controls how far ahead the dashboard lists upcoming events.
        </span>
      </div>
    </div>
  );
}
