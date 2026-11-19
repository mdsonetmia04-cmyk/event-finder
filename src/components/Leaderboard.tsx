"use client";

/* Dashboard leaderboard: top learners by time spent on the platform.
   Four boards — today, last 7 days, this month, all time — read through
   the get_leaderboard RPC, which returns display names + seconds + avatar
   URLs only (never phone numbers or earnings). Hidden entirely when the
   RPC is unavailable, so the dashboard never breaks pre-migration.
   The top 3 stand on a podium; ranks 4+ are list rows. */

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Crown, Trophy } from "lucide-react";
import { Section } from "@/components/sections";
import { EmptyState } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { formatUsage } from "@/lib/presence";

type Period = "day" | "week" | "month" | "all";

interface Row {
  display_name: string;
  seconds: number;
  is_you: boolean;
  avatar_url: string | null;
}

const MEDALS: Record<number, { ring: string; bg: string; fg: string }> = {
  1: { ring: "#D9A044", bg: "#D9A044", fg: "#1a1409" },
  2: { ring: "#9AA3AF", bg: "#9AA3AF", fg: "#141414" },
  3: { ring: "#B07A4F", bg: "#B07A4F", fg: "#fff8ef" },
};

const REFRESH_MS = 30 * 1000;

/** Round avatar: the user's picture, or a medal-toned initial circle. */
function LeaderAvatar({
  url,
  name,
  rank,
  sizeClass,
  textClass,
  highlight,
}: {
  url: string | null;
  name: string;
  rank: number;
  sizeClass: string;
  textClass: string;
  highlight?: boolean;
}) {
  const medal = MEDALS[rank];
  const ring = medal ? medal.ring : "var(--line)";
  const style: CSSProperties = {
    border: `3px solid ${ring}`,
    ...(highlight ? { boxShadow: "0 0 0 4px var(--gold-soft)" } : {}),
  };
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover`}
        style={style}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${sizeClass} ${textClass} font-serif-d flex shrink-0 items-center justify-center rounded-full font-bold`}
      style={{ ...style, background: medal ? medal.bg : "var(--gold)", color: medal ? medal.fg : "#FFF9EC" }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

function YouChip({ label }: { label: string }) {
  return (
    <span
      className="chip ml-2 !px-2 !py-0.5 !text-[10px] font-bold"
      style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
    >
      {label}
    </span>
  );
}

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
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(period);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [period, load]);

  if (failed) return null;

  const tabs = (
    <div
      className="flex max-w-full gap-2 overflow-x-auto pb-1"
      role="tablist"
      aria-label={t.leaderboard.title}
    >
      {(
        [
          ["day", t.leaderboard.today],
          ["week", t.leaderboard.thisWeek],
          ["month", t.leaderboard.thisMonth],
          ["all", t.leaderboard.allTime],
        ] as [Period, string][]
      ).map(([p, label]) => (
        <button
          key={p}
          role="tab"
          aria-selected={period === p}
          onClick={() => setPeriod(p)}
          className="chip whitespace-nowrap !cursor-pointer !px-3 !py-1.5"
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

  const showPodium = rows !== null && rows.length >= 3;
  // Podium order: 2nd left, 1st centre (raised), 3rd right.
  const podium: Array<{ row: Row; rank: number }> = showPodium
    ? [
        { row: rows[1], rank: 2 },
        { row: rows[0], rank: 1 },
        { row: rows[2], rank: 3 },
      ]
    : [];
  const listRows: Array<{ row: Row; rank: number }> = rows
    ? (showPodium ? rows.slice(3) : rows).map((row, i) => ({
        row,
        rank: showPodium ? i + 4 : i + 1,
      }))
    : [];

  return (
    <Section title={t.leaderboard.title} sub={t.leaderboard.sub} action={tabs}>
      <div className="card overflow-hidden p-0">
        {rows === null ? (
          <div className="p-4" aria-label="Loading">
            <div className="flex items-end justify-center gap-4 sm:gap-6">
              {[56, 72, 56].map((size, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-full"
                  style={{ width: size, height: size, background: "var(--surface2)" }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg" style={{ background: "var(--surface2)" }} />
              ))}
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState title={t.leaderboard.emptyT} hint={t.leaderboard.emptyH} />
          </div>
        ) : (
          <>
            {showPodium && (
              <div className="grid grid-cols-3 items-end gap-2 px-4 pt-5 sm:gap-3 sm:px-6">
                {podium.map(({ row, rank }) => {
                  const medal = MEDALS[rank];
                  const first = rank === 1;
                  return (
                    <div key={`${row.display_name}-${rank}`} className="flex min-w-0 flex-col items-center text-center">
                      <span className="flex h-6 items-end justify-center" aria-hidden="true">
                        {first && <Crown size={20} style={{ color: "#D9A044" }} />}
                      </span>
                      <LeaderAvatar
                        url={row.avatar_url}
                        name={row.display_name}
                        rank={rank}
                        sizeClass={first ? "h-16 w-16 sm:h-20 sm:w-20" : "h-14 w-14 sm:h-16 sm:w-16"}
                        textClass={first ? "text-2xl" : "text-xl"}
                        highlight={row.is_you}
                      />
                      <p
                        className="mt-2 w-full truncate text-sm font-semibold"
                        title={row.display_name}
                      >
                        {row.display_name}
                      </p>
                      <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--muted)" }}>
                        {formatUsage(row.seconds, lang)}
                      </p>
                      {row.is_you && (
                        <span
                          className="chip mt-1 !px-2 !py-0.5 !text-[10px] font-bold"
                          style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
                        >
                          {t.leaderboard.you}
                        </span>
                      )}
                      <div
                        className="mt-3 flex w-full items-start justify-center rounded-t-xl pt-1.5"
                        style={{
                          height: first ? 48 : rank === 2 ? 36 : 28,
                          background: `${medal.bg}26`,
                          borderTop: `2px solid ${medal.bg}`,
                        }}
                        aria-label={`${t.leaderboard.rank} ${rank}`}
                      >
                        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--muted)" }}>
                          {rank}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {listRows.length > 0 && (
              <>
                <div
                  className="flex items-center gap-2 border-b px-4 py-3 text-[11px] font-bold uppercase tracking-wide"
                  style={{
                    borderColor: "var(--line)",
                    color: "var(--muted)",
                    borderTop: showPodium ? "1px solid var(--line)" : undefined,
                  }}
                >
                  <Trophy size={14} style={{ color: "var(--gold)" }} aria-hidden="true" />
                  <span className="w-10">{t.leaderboard.rank}</span>
                  <span className="flex-1">{t.leaderboard.learner}</span>
                  <span className="tabular-nums">{t.leaderboard.timeSpent}</span>
                </div>
                <ol>
                  {listRows.map(({ row, rank }, i) => {
                    const badge = MEDALS[rank];
                    return (
                      <li
                        key={`${row.display_name}-${rank}`}
                        className="flex items-center gap-2 px-4 py-3"
                        style={{
                          background: row.is_you ? "var(--gold-soft)" : undefined,
                          borderBottom: i < listRows.length - 1 ? "1px solid var(--line)" : undefined,
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
                        <LeaderAvatar
                          url={row.avatar_url}
                          name={row.display_name}
                          rank={rank}
                          sizeClass="h-9 w-9"
                          textClass="text-sm"
                          highlight={row.is_you}
                        />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {row.display_name}
                          {row.is_you && <YouChip label={t.leaderboard.you} />}
                        </span>
                        <span className="text-sm font-semibold tabular-nums">{formatUsage(row.seconds, lang)}</span>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </>
        )}
      </div>
    </Section>
  );
}
