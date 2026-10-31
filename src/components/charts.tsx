"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_LABEL } from "@/lib/data";
import { STAGE_LABEL } from "@/lib/recommendation-engine";
import type { EventCategory, PrepStage } from "@/types/event";

function tooltipStyle(): React.CSSProperties {
  return {
    background: "var(--surface)",
    border: "1px solid var(--line)",
    borderRadius: 10,
    color: "var(--text)",
    fontSize: 12,
  };
}

export function CategoryBarChart({
  data,
  labels,
}: {
  data: { category: EventCategory; count: number }[];
  labels?: Record<string, string>;
}) {
  const rows = data.map((d) => ({
    name: labels?.[d.category] ?? CATEGORY_LABEL[d.category],
    count: d.count,
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid stroke="var(--line)" horizontal={false} vertical={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle()} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--gold)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StageDonutChart({
  data,
  labels,
}: {
  data: { stage: PrepStage; count: number }[];
  labels?: Record<string, string>;
}) {
  const labelOf = (s: PrepStage) => labels?.[s] ?? STAGE_LABEL[s];
  const rows = data
    .filter((d) => d.count > 0)
    .map((d, i, arr) => ({
      name: labelOf(d.stage).split(":")[0].trim(),
      full: labelOf(d.stage),
      count: d.count,
      /* one hue, stepped opacity: largest segment most saturated */
      opacity: 1 - (i / Math.max(arr.length, 1)) * 0.65,
    }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="count" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} strokeWidth={0} fill="var(--gold)">
            {rows.map((r, i) => (
              <Cell key={i} fill="var(--gold)" fillOpacity={r.opacity} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle()}
            formatter={(value, _name, item) => {
              const full = (item as unknown as { payload?: { full?: string } })?.payload?.full ?? "Events";
              return [`${value}`, full];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
