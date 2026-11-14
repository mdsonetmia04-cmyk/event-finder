"use client";

/* Dashboard leaderboard: top learners by time spent on the platform.
   Reads through the get_leaderboard RPC, which returns display names +
   seconds only (never phone numbers or earnings). Hidden entirely when
   the RPC is unavailable, so the dashboard never breaks pre-migration. */

import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Section } from "@/components/sections";
import { EmptyState } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { formatUsage } from "@/lib/presence";

type Period = "month" | "all";

interface Row {
  display_name: string;
  seconds: number;
  is_you: boolean;
}

const RANK_STYLES: Record<number, { bg: string; fg: string }> = {
  1: { bg: "#D9A044", fg: "#1a1409" },
  2: { bg: "#9AA3AF", fg: "#141414" },
  3: { bg: "#B07A4F", fg: "#fff8ef" },
};

const REFRESH_MS = 5 * 60 * 1000;

export default function Leaderboard() {
  const { lang, t } = useLang();
  const [period, setPeriod] = useState<Period>("month");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (p: Period) => {
    const supabase = getSupabase();
    if (!supabase) {
      setFailed(true);
      return;
    }
    const { data, error } = await supabase.rpc("get_leaderboard", {
      p_period: p,
      p_limit: 10,
    });
    if (error) {
      setFailed(true);
      return;
    }
    setRows((data ?? []) as Row[]);
  }, []);

  useEffect(() => {
    setRows(null);
    setFailed(false);
    void load(period);
    const id = setInterval(() => void load(period), REFRESH_MS);
    return () => clearInterval(id);
  }, [period, load]);

  if (failed) return null;

  const tabs = (
    <div className="flex gap-2" role="tablist" aria-label={t.leaderboard.title}>
      {(
        [
          ["month", t.leaderboard.thisMonth],
          ["all", t.leaderboard.allTime],
        ] as [Period, string][]
      ).map(([p, label]) => (
        <button
          key={p}
          role="tab"
          aria-selected={period === p}
          onClick={() => setPeriod(p)}
          className="chip !cursor-pointer !px-3 !py-1.5"
          style={
            period === p
              ? { background: "var(--gold-soft)", borderColor: "var(--gold)", color: "var(--text)", fontWeight: 700 }
              : undefined
          }
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <Section title={t.leaderboard.title} sub={t.leaderboard.sub} action={tabs}>
      <div className="card overflow-hidden p-0">
        <div
          className="flex items-center gap-2 border-b px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          <Trophy size={14} style={{ color: "var(--gold)" }} aria-hidden="true" />
          <span className="w-10">{t.leaderboard.rank}</span>
          <span className="flex-1">{t.leaderboard.learner}</span>
          <span className="tabular-nums">{t.leaderboard.timeSpent}</span>
        </div>
        {rows === null ? (
          <div className="flex flex-col gap-2 p-4" aria-label="Loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: "var(--surface2)" }} />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t.leaderboard.emptyT} hint={t.leaderboard.emptyH} />
          </div>
        ) : (
          <ol>
            {rows.map((row, i) => {
              const rank = i + 1;
              const badge = RANK_STYLES[rank];
              return (
                <li
                  key={`${row.display_name}-${rank}`}
                  className="flex items-center gap-2 px-4 py-3"
                  style={{
                    background: row.is_you ? "var(--gold-soft)" : undefined,
                    borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : undefined,
                  }}
                >
                  <span className="w-10">
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold tabular-nums"
                      style={
                        badge
                          ? { background: badge.bg, color: badge.fg }
                          : { background: "var(--surface2)", color: "var(--muted)" }
                      }
                    >
                      {rank}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {row.display_name}
                    {row.is_you && (
                      <span
                        className="chip ml-2 !px-2 !py-0.5 !text-[10px] font-bold"
                        style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
                      >
                        {t.leaderboard.you}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{formatUsage(row.seconds, lang)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Section>
  );
}
