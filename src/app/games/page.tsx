"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bot,
  Check,
  Eye,
  Lightbulb,
  PencilLine,
  Play,
  Star,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { GameChat } from "@/components/GameChat";
import { LiveUsersCard, gameLabelFor } from "@/components/LiveUsersCard";
import { LudoAvatar } from "@/components/LudoGame";
import { isLiveNow } from "@/lib/presence";
import { parseLiveUser, type LiveUser } from "@/lib/zone-chat";
import { COLOR_HEX } from "@/lib/ludo/room";

const LIVE_POLL_MS = 30_000;

/** Decorative CSS mini Ludo board: coloured corner bases + track cross. */
function MiniBoard({ big = false }: { big?: boolean }) {
  const cells: (string | null)[][] = [];
  for (let r = 0; r < 7; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < 7; c++) {
      if (r < 2 && c < 2) row.push(COLOR_HEX.red);
      else if (r < 2 && c > 4) row.push(COLOR_HEX.green);
      else if (r > 4 && c < 2) row.push(COLOR_HEX.blue);
      else if (r > 4 && c > 4) row.push(COLOR_HEX.yellow);
      else if (r === 3 && c === 3) row.push("#E8B64C");
      else if (r === 3 || c === 3) row.push("rgba(255,255,255,0.14)");
      else row.push(null);
    }
    cells.push(row);
  }
  return (
    <div
      className={`grid shrink-0 grid-cols-7 gap-[2px] rounded-xl border p-1.5 ${big ? "w-40 sm:w-44" : "w-28 sm:w-32"}`}
      style={{
        borderColor: "rgba(232, 182, 76, 0.4)",
        background: "#101015",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.6), 0 10px 22px -10px rgba(232, 182, 76, 0.4)",
      }}
      aria-hidden="true"
    >
      {cells.flat().map((color, i) => (
        <span
          key={i}
          className="aspect-square rounded-[2px]"
          style={{ background: color ?? "transparent", border: color ? "1px solid rgba(255,255,255,0.12)" : undefined }}
        />
      ))}
    </div>
  );
}

/** Quiz art: giant gold "?" + three answer rows, first one checked. */
function ArcadeQuizArt() {
  return (
    <div className="flex items-center justify-center gap-4" aria-hidden="true">
      <span
        className="font-serif-d text-[92px] leading-none font-bold"
        style={{
          background: "linear-gradient(180deg,#FBE7B0,#E8B64C 55%,#B97F1E)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 4px 14px rgba(232,182,76,0.45))",
        }}
      >
        ?
      </span>
      <span className="flex flex-col gap-2">
        {[true, false, false].map((ok, i) => (
          <span
            key={i}
            className="flex w-28 items-center gap-2 rounded-lg border px-2.5 py-2"
            style={{ borderColor: "rgba(232,182,76,0.3)", background: "rgba(255,255,255,0.04)" }}
          >
            {ok ? (
              <Check size={13} style={{ color: "#4ADE80" }} />
            ) : (
              <span className="h-3 w-3 shrink-0 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.35)" }} />
            )}
            <span className="h-2 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
          </span>
        ))}
      </span>
    </div>
  );
}

/** Word Meaning Battle art: giant gold "Aa" + three word rows, first one checked. */
function ArcadeWordArt() {
  return (
    <div className="flex items-center justify-center gap-4" aria-hidden="true">
      <span
        className="font-serif-d text-[84px] leading-none font-bold"
        style={{
          background: "linear-gradient(180deg,#FBE7B0,#E8B64C 55%,#B97F1E)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 4px 14px rgba(232,182,76,0.45))",
        }}
      >
        Aa
      </span>
      <span className="flex flex-col gap-2">
        {[true, false, false].map((ok, i) => (
          <span
            key={i}
            className="flex w-28 items-center gap-2 rounded-lg border px-2.5 py-2"
            style={{ borderColor: "rgba(232,182,76,0.3)", background: "rgba(255,255,255,0.04)" }}
          >
            {ok ? (
              <Check size={13} style={{ color: "#4ADE80" }} />
            ) : (
              <span className="h-3 w-3 shrink-0 rounded-full border" style={{ borderColor: "rgba(255,255,255,0.35)" }} />
            )}
            <span className="h-2 flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.14)" }} />
          </span>
        ))}
      </span>
    </div>
  );
}

/** Draw & Guess art: gold pencil doodling a star + lightbulb. */
function ArcadeDrawArt() {
  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden="true">
      <PencilLine
        size={64}
        style={{ color: "#F3D9A0", transform: "rotate(-18deg)", filter: "drop-shadow(0 4px 12px rgba(232,182,76,0.4))" }}
      />
      <Star size={30} className="absolute" style={{ color: "#E8B64C", top: "12%", left: "20%" }} />
      <Lightbulb size={28} className="absolute" style={{ color: "#F3D9A0", bottom: "12%", right: "18%" }} />
      <span
        className="absolute bottom-5 left-1/2 h-px w-24 -translate-x-1/2 border-t border-dashed"
        style={{ borderColor: "rgba(243,217,160,0.5)" }}
      />
    </div>
  );
}

/** Arrows Out art: target with two arrows in it (inline SVG). */
function ArcadeArrowsArt() {
  return (
    <svg
      viewBox="0 0 140 140"
      className="h-36 w-36"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 6px 16px rgba(232,182,76,0.3))" }}
    >
      <defs>
        <marker id="arcade-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#8A5A12" />
        </marker>
      </defs>
      <circle cx="70" cy="70" r="62" fill="#F5EFE4" />
      <circle cx="70" cy="70" r="48" fill="#E8B64C" />
      <circle cx="70" cy="70" r="34" fill="#F5EFE4" />
      <circle cx="70" cy="70" r="20" fill="#C44D45" />
      <circle cx="70" cy="70" r="8" fill="#8A1F1A" />
      <line x1="16" y1="120" x2="64" y2="76" stroke="#8A5A12" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arcade-arrow)" />
      <line x1="124" y1="20" x2="78" y2="64" stroke="#5B3A0E" strokeWidth="4" strokeLinecap="round" markerEnd="url(#arcade-arrow)" />
    </svg>
  );
}

/** Bubble Shooter art: glossy bubble cluster in the in-game palette. */
function ArcadeBubbleArt() {
  const bubbles = [
    { left: "10%", top: "16%", size: 44, bg: "radial-gradient(circle at 32% 30%, #F6B0B3 0%, #E5484D 55%, #9B1C21 100%)" },
    { left: "40%", top: "4%", size: 52, bg: "radial-gradient(circle at 32% 30%, #A8C4F8 0%, #3E7BFA 55%, #1C3F9B 100%)" },
    { left: "68%", top: "20%", size: 40, bg: "radial-gradient(circle at 32% 30%, #F5D9A3 0%, #D9A044 55%, #8A5A12 100%)" },
    { left: "26%", top: "52%", size: 46, bg: "radial-gradient(circle at 32% 30%, #C9F2D4 0%, #2FA36B 55%, #14532D 100%)" },
    { left: "58%", top: "54%", size: 42, bg: "radial-gradient(circle at 32% 30%, #E3C9F7 0%, #8E4EC6 55%, #3B1470 100%)" },
  ];
  return (
    <div className="relative h-full w-full" aria-hidden="true">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            background: b.bg,
            boxShadow: "0 8px 16px -6px rgba(0,0,0,0.6), inset 0 2px 6px rgba(255,255,255,0.35)",
          }}
        />
      ))}
    </div>
  );
}

/** Chess art: wood-tone 8x8 board, gold pieces at the bottom. */
function ArcadeChessArt() {
  const back = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"];
  return (
    <div
      className="grid h-36 w-36 grid-cols-8 overflow-hidden rounded-lg border"
      style={{ borderColor: "rgba(232,182,76,0.4)", boxShadow: "0 8px 20px -8px rgba(0,0,0,0.7)" }}
      aria-hidden="true"
    >
      {Array.from({ length: 64 }, (_, i) => {
        const r = Math.floor(i / 8);
        const c = i % 8;
        const light = (r + c) % 2 === 0;
        let piece = "";
        if (r === 0 || r === 7) piece = back[c];
        else if (r === 1 || r === 6) piece = "♟";
        const gold = r >= 6;
        return (
          <span
            key={i}
            className="flex items-center justify-center text-[15px] leading-none"
            style={{ background: light ? "#EBD0A0" : "#9C6B41", color: gold ? "#8A5A12" : "#211A14" }}
          >
            {piece}
          </span>
        );
      })}
    </div>
  );
}

/** One arcade game card: artwork well + gold title + desc + actions. */
function ArcadeCard({
  art,
  title,
  desc,
  children,
}: {
  art: ReactNode;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <article className="arcade-card flex flex-col overflow-hidden p-4 sm:p-5">
      <div className="arcade-art relative flex h-40 items-center justify-center overflow-hidden rounded-xl">
        {art}
      </div>
      <h3 className="font-serif-d mt-4 text-center text-2xl font-bold" style={{ color: "#F3D9A0" }}>
        {title}
      </h3>
      <p className="mt-1.5 flex-1 text-center text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {desc}
      </p>
      <div className="mt-4 flex flex-col gap-2">{children}</div>
    </article>
  );
}

/** LIVE NOW strip: real live users (same get_live_users signal as the
    live-users card) — avatar + name + the game they are playing, plus
    the online count and a link to the live-watch page. */
function LiveNowStrip() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);

  const loadLive = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("get_live_users");
    if (error || !data) return;
    const users: LiveUser[] = [];
    for (const row of data as unknown[]) {
      const u = parseLiveUser(row);
      if (u && isLiveNow(u.last_seen)) users.push(u);
    }
    setLiveUsers(users);
  }, []);

  useEffect(() => {
    if (!ready || !session) return;
    void loadLive();
    const id = setInterval(() => void loadLive(), LIVE_POLL_MS);
    return () => clearInterval(id);
  }, [ready, session, loadLive]);

  if (!ready || !session) return null;

  const labels = {
    ludo: t.games.ludoTitle,
    quizBattle: t.games.quizTitle,
    wordBattle: t.games.wordTitle,
    drawGuess: t.games.drawTitle,
    arrowsOut: t.games.arrowsTitle,
    bubbleShooter: t.games.bubbleTitle,
    chess: t.games.chessTitle,
  };
  const inZone = liveUsers.filter((u) => u.in_zone);
  const chips = [...inZone, ...liveUsers.filter((u) => !u.in_zone)].slice(0, 4);

  return (
    <div className="arcade-strip flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-4 py-3">
      <span className="flex items-center gap-2">
        <span className="live-dot" aria-hidden="true" />
        <span className="font-serif-d text-lg font-bold tracking-wide" style={{ color: "#F3D9A0" }}>
          {t.zoneChat.liveTitle}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: "#237A44", color: "#fff", boxShadow: "0 0 10px rgba(35,122,68,0.55)" }}
        >
          {t.zoneChat.livePill}
        </span>
      </span>
      {chips.length === 0 ? (
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          {t.zoneChat.liveEmpty}
        </span>
      ) : (
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          {chips.map((u) => {
            const gameLabel = gameLabelFor(u.current_game, labels);
            return (
              <span key={u.user_id} className="flex min-w-0 items-center gap-2">
                <LudoAvatar url={u.avatar_url} name={u.display_name} size={28} />
                <span className="truncate text-sm font-semibold">{u.display_name}</span>
                {gameLabel && (
                  <span
                    className="shrink-0 rounded-full border px-1.5 py-px text-[10px] font-bold whitespace-nowrap"
                    style={{
                      background: "color-mix(in srgb, var(--gold) 12%, transparent)",
                      borderColor: "color-mix(in srgb, var(--gold) 40%, transparent)",
                      color: "var(--gold-deep)",
                    }}
                  >
                    {gameLabel}
                  </span>
                )}
              </span>
            );
          })}
        </span>
      )}
      <span className="ms-auto flex items-center gap-2">
        <span
          className="chip !py-0.5 text-[11px] font-semibold"
          style={{
            background: "color-mix(in srgb, var(--gold) 12%, transparent)",
            borderColor: "color-mix(in srgb, var(--gold) 35%, transparent)",
            color: "var(--gold-deep)",
          }}
        >
          <Users size={12} aria-hidden="true" />
          {t.zoneChat.liveCount(liveUsers.length)}
        </span>
        <Link href="/games/live" className="btn btn-ghost !px-3 !py-1.5 !text-xs">
          <Eye size={14} aria-hidden="true" />
          {t.liveWatch.button}
        </Link>
      </span>
    </div>
  );
}

export default function GamesPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const [record, setRecord] = useState<{ played: number; won: number } | null>(null);
  const [recordLoaded, setRecordLoaded] = useState(false);

  useEffect(() => {
    if (!ready || !session) return;
    const supabase = getSupabase();
    if (!supabase) {
      setRecordLoaded(true);
      return;
    }
    let cancelled = false;
    const containment = JSON.stringify([{ user_id: session.id }]);
    Promise.all([
      supabase
        .from("ludo_rooms")
        .select("id", { count: "exact", head: true })
        .eq("status", "finished")
        .filter("players", "cs", containment),
      supabase
        .from("ludo_rooms")
        .select("id", { count: "exact", head: true })
        .eq("winner_id", session.id),
    ]).then(([playedRes, wonRes]) => {
      if (cancelled) return;
      if (!playedRes.error && !wonRes.error && playedRes.count !== null && wonRes.count !== null) {
        setRecord({ played: playedRes.count, won: wonRes.count });
      }
      setRecordLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, session]);

  return (
    /* Dark Arcade zone: full-bleed dark band under the header. The
       .arcade scope forces the charcoal + gold palette in both site
       themes, so Game Chat and the live-users card go dark too. */
    <div className="arcade arcade-bg -mt-6 ml-[calc(50%-50vw)] w-screen px-4 pt-10 pb-12 sm:-mt-8 sm:px-6 sm:pt-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Hero: big gold-gradient title + subtitle. */}
        <header className="text-center">
          <h1 className="arcade-title font-serif-d text-5xl font-bold tracking-tight sm:text-6xl">
            {t.games.zoneTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--muted)" }}>
            {t.games.zoneSub}
          </p>
        </header>

        <LiveNowStrip />

        {/* Seven games, equal arcade cards. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ArcadeCard art={<MiniBoard big />} title={t.games.ludoTitle} desc={t.games.ludoDesc}>
            <Link href="/games/ludo/solo" className="arcade-play">
              <Bot size={17} aria-hidden="true" />
              {t.games.playVsComputer}
            </Link>
            <div className="flex gap-2">
              <Link href="/games/ludo/friends" className="btn btn-ghost flex-1 !px-2 !text-xs">
                <Users size={15} aria-hidden="true" />
                {t.games.playWithFriends}
              </Link>
              <Link href="/games/live" className="btn btn-ghost flex-1 !px-2 !text-xs">
                <Eye size={15} aria-hidden="true" />
                {t.liveWatch.button}
              </Link>
            </div>
          </ArcadeCard>

          <ArcadeCard art={<ArcadeQuizArt />} title={t.games.quizTitle} desc={t.games.quizDesc}>
            <Link href="/games/quiz-battle" className="arcade-play">
              <Play size={17} aria-hidden="true" />
              {t.games.playNow}
            </Link>
          </ArcadeCard>

          <ArcadeCard art={<ArcadeWordArt />} title={t.games.wordTitle} desc={t.games.wordDesc}>
            <Link href="/games/word-battle" className="arcade-play">
              <Play size={17} aria-hidden="true" />
              {t.games.playNow}
            </Link>
          </ArcadeCard>

          <ArcadeCard art={<ArcadeDrawArt />} title={t.games.drawTitle} desc={t.games.drawDesc}>
            <Link href="/games/draw-guess" className="arcade-play">
              <Play size={17} aria-hidden="true" />
              {t.games.playWithFriends}
            </Link>
          </ArcadeCard>

          <ArcadeCard art={<ArcadeArrowsArt />} title={t.games.arrowsTitle} desc={t.games.arrowsDesc}>
            <Link href="/games/arrows-out" className="arcade-play">
              <Play size={17} aria-hidden="true" />
              {t.games.playNow}
            </Link>
          </ArcadeCard>

          <ArcadeCard art={<ArcadeBubbleArt />} title={t.games.bubbleTitle} desc={t.games.bubbleDesc}>
            <Link href="/games/bubble-shooter" className="arcade-play">
              <Play size={17} aria-hidden="true" />
              {t.games.playNow}
            </Link>
          </ArcadeCard>

          <ArcadeCard art={<ArcadeChessArt />} title={t.games.chessTitle} desc={t.games.chessDesc}>
            <Link href="/games/chess" className="arcade-play">
              <Play size={17} aria-hidden="true" />
              {t.games.playNow}
            </Link>
          </ArcadeCard>
        </div>

        {/* Two columns on large screens: Game Chat on the left, the tall
            live-users card on the right. Single column on mobile. */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <GameChat />
          <LiveUsersCard />
        </div>

        {/* My Ludo record: real counts only, friendly empty state otherwise. */}
        <section className="card p-5">
          <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
            <Trophy size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
            {t.games.recordTitle}
          </h2>
          {!recordLoaded ? (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {t.ludo.loading}
            </p>
          ) : record && record.played > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 text-center" style={{ background: "var(--surface2)" }}>
                <p className="font-serif-d text-3xl font-bold">{record.played}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                  {t.games.recordPlayed}
                </p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ background: "var(--surface2)" }}>
                <p className="font-serif-d text-3xl font-bold">{record.won}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                  {t.games.recordWon}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm font-medium">{t.games.recordNone}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {t.games.recordHint}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
