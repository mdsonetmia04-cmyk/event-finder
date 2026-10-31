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
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/data";
import { STAGE_COLOR, STAGE_LABEL } from "@/lib/recommendation-engine";
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

export function CategoryBarChart({ data }: { data: { category: EventCategory; count: number }[] }) {
  const rows = data.map((d) => ({ name: CATEGORY_LABEL[d.category], count: d.count, fill: CATEGORY_COLOR[d.category] }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle()} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StageDonutChart({ data }: { data: { stage: PrepStage; count: number }[] }) {
  const rows = data
    .filter((d) => d.count > 0)
    .map((d) => ({ name: STAGE_LABEL[d.stage].split("—")[0].split("&")[0].trim(), full: STAGE_LABEL[d.stage], count: d.count, fill: STAGE_COLOR[d.stage] }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="count" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2} strokeWidth={0}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.fill} />
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
