"use client";

/* The Year Dial: a living circular calendar and the site's signature move.
   101 events plotted around one ring by their real dates. The gold needle is
   today; the ink needle is your planning date. Drag either (or use arrow
   keys) and the whole dashboard follows. */

import { useMemo, useRef, useState } from "react";
import { EVENTS } from "@/lib/data";
import { daysBetween, todayISO } from "@/lib/date-engine";
import { useLang } from "@/i18n/LanguageContext";

const CX = 180;
const CY = 180;
const R_OUT = 152;
const R_DOT = 112;

function polar(angleDeg: number, r: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function dayOfYear(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
}

function isoFromDoy(year: number, doy: number): string {
  return new Date(Date.UTC(year, 0, doy)).toISOString().slice(0, 10);
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const TIER_R = [5.2, 4.2, 3.2, 2.4];
const TIER_O = [1, 0.85, 0.6, 0.4];

export default function YearDial({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  const { t } = useLang();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  const year = Number(date.slice(0, 4));
  const dim = new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
  const today = todayISO();
  const todayYear = Number(today.slice(0, 4));

  const dots = useMemo(() => {
    const out: { id: string; name: string; date: string; angle: number; tier: number; du: number }[] = [];
    for (const e of EVENTS) {
      const d = e.dates[String(year)];
      if (!d) continue;
      const du = daysBetween(today, d);
      if (du < 0) continue;
      const tier = du <= 30 ? 0 : du <= 60 ? 1 : du <= 120 ? 2 : 3;
      out.push({ id: e.id, name: e.name, date: d, angle: (dayOfYear(d) / dim) * 360, tier, du });
    }
    return out.sort((a, b) => a.tier - b.tier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const focus = dots.length > 0 ? dots.reduce((a, b) => (a.du < b.du ? a : b)) : null;
  const urgentCount = dots.filter((d) => d.du <= 7).length;

  const selectedAngle = (dayOfYear(date) / dim) * 360;
  const todayAngle = year === todayYear ? (dayOfYear(today) / dim) * 360 : null;

  const angleFromPointer = (clientX: number, clientY: number) => {
    const el = svgRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const x = clientX - r.left - r.width / 2;
    const y = clientY - r.top - r.height / 2;
    let deg = (Math.atan2(y, x) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return deg;
  };

  const scrubTo = (clientX: number, clientY: number) => {
    const deg = angleFromPointer(clientX, clientY);
    const doy = Math.min(dim, Math.max(1, Math.round((deg / 360) * dim)));
    onChange(isoFromDoy(year, doy));
  };

  const nudge = (days: number) => {
    const doy = Math.min(dim, Math.max(1, dayOfYear(date) + days));
    onChange(isoFromDoy(year, doy));
  };

  const sel = polar(selectedAngle, R_OUT);
  const tip = polar(selectedAngle, R_DOT);

  return (
    <div className="dial-wrap">
      <svg
        ref={svgRef}
        viewBox="0 0 360 360"
        className="dial-svg"
        role="slider"
        aria-label={t.dash.scrubT}
        aria-valuetext={date}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); nudge(1); }
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); nudge(-1); }
          if (e.key === "PageUp") { e.preventDefault(); nudge(7); }
          if (e.key === "PageDown") { e.preventDefault(); nudge(-7); }
        }}
        onPointerDown={(e) => {
          setDragging(true);
          (e.target as Element).setPointerCapture?.(e.pointerId);
          scrubTo(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging) scrubTo(e.clientX, e.clientY);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        style={{ cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
      >
        {/* outer ring */}
        <circle cx={CX} cy={CY} r={R_OUT} fill="none" stroke="var(--line)" strokeWidth={1.5} />
        <circle cx={CX} cy={CY} r={R_DOT - 14} fill="none" stroke="var(--line)" strokeWidth={1} opacity={0.6} />

        {/* month boundary ticks */}
        {MONTHS.map((_, m) => {
          const a = (dayOfYear(`${year}-${String(m + 1).padStart(2, "0")}-01`) / dim) * 360;
          const p1 = polar(a, R_OUT - 8);
          const p2 = polar(a, R_OUT + 1);
          return <line key={m} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--line)" strokeWidth={2} />;
        })}

        {/* month labels */}
        {MONTHS.map((label, m) => {
          const a = (dayOfYear(`${year}-${String(m + 1).padStart(2, "0")}-15`) / dim) * 360;
          const p = polar(a, R_OUT - 20);
          return (
            <text
              key={label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={8.5}
              fontWeight={700}
              letterSpacing={1}
              fill="var(--muted)"
            >
              {label}
            </text>
          );
        })}

        {/* event dots */}
        {dots.map((d) => {
          const p = polar(d.angle, R_DOT);
          return (
            <circle
              key={d.id}
              cx={p.x}
              cy={p.y}
              r={TIER_R[d.tier]}
              fill="var(--gold)"
              opacity={TIER_O[d.tier]}
            >
              <title>{`${d.name} · ${d.date}`}</title>
            </circle>
          );
        })}

        {/* today needle */}
        {todayAngle !== null && (
          <g opacity={0.9}>
            <line
              x1={CX}
              y1={CY}
              x2={polar(todayAngle, R_OUT).x}
              y2={polar(todayAngle, R_OUT).y}
              stroke="var(--gold)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <circle cx={polar(todayAngle, R_OUT).x} cy={polar(todayAngle, R_OUT).y} r={4} fill="var(--gold)" />
          </g>
        )}

        {/* planning-date needle */}
        <line x1={CX} y1={CY} x2={sel.x} y2={sel.y} stroke="var(--text)" strokeWidth={2} strokeLinecap="round" opacity={0.75} />
        <line x1={CX} y1={CY} x2={tip.x} y2={tip.y} stroke="var(--text)" strokeWidth={5} strokeLinecap="round" opacity={0.25} />
        <circle cx={sel.x} cy={sel.y} r={dragging ? 11 : 8} fill="var(--surface)" stroke="var(--text)" strokeWidth={2.5} style={{ transition: "r 0.15s" }} />
        <circle cx={CX} cy={CY} r={5} fill="var(--text)" />
      </svg>

      {/* center readout */}
      <div className="dial-center" aria-hidden="true">
        {focus ? (
          <>
            <span className="dial-num">{focus.du}</span>
            <span className="dial-cap">
              {t.dash.daysTo} {focus.name}
            </span>
            {urgentCount > 0 && <span className="dial-sub">{t.dash.urgentWeek(urgentCount)}</span>}
          </>
        ) : (
          <span className="dial-cap">{t.dash.findingIdle}</span>
        )}
      </div>
    </div>
  );
}
