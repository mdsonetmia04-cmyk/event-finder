"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  Circle,
  Crown,
  HelpCircle,
  MoveUpRight,
  PencilLine,
  Play,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { SectionHeader } from "@/components/ui";
import { GameChat } from "@/components/GameChat";
import { LiveUsersCard } from "@/components/LiveUsersCard";
import { COLOR_HEX } from "@/lib/ludo/room";

/** Decorative CSS mini Ludo board: coloured corner bases + track cross. */
function MiniBoard() {
  const cells: (string | null)[][] = [];
  for (let r = 0; r < 7; r++) {
    const row: (string | null)[] = [];
    for (let c = 0; c < 7; c++) {
      if (r < 2 && c < 2) row.push(COLOR_HEX.red);
      else if (r < 2 && c > 4) row.push(COLOR_HEX.green);
      else if (r > 4 && c < 2) row.push(COLOR_HEX.blue);
      else if (r > 4 && c > 4) row.push(COLOR_HEX.yellow);
      else if (r === 3 && c === 3) row.push("var(--gold)");
      else if (r === 3 || c === 3) row.push("var(--surface2)");
      else row.push(null);
    }
    cells.push(row);
  }
  return (
    <div
      className="grid w-28 shrink-0 grid-cols-7 gap-[2px] rounded-xl border p-1.5 sm:w-32"
      style={{
        borderColor: "var(--line)",
        background: "var(--surface)",
        boxShadow: "0 0 0 1px color-mix(in srgb, var(--gold) 40%, transparent), 0 8px 18px -10px rgba(166, 106, 25, 0.55)",
      }}
      aria-hidden="true"
    >
      {cells.flat().map((color, i) => (
        <span
          key={i}
          className="aspect-square rounded-[2px]"
          style={{ background: color ?? "transparent", border: color ? "1px solid var(--line)" : undefined }}
        />
      ))}
    </div>
  );
}

/** Decorative CSS mini chess board: 4x4 wood-tone checkerboard. */
function MiniChessboard() {
  return (
    <span
      className="grid h-11 w-11 shrink-0 grid-cols-4 overflow-hidden rounded-full"
      style={{ boxShadow: "0 6px 14px -6px rgba(124, 79, 39, 0.55)" }}
      aria-hidden="true"
    >
      {Array.from({ length: 16 }, (_, i) => {
        const r = Math.floor(i / 4);
        const c = i % 4;
        return (
          <span key={i} style={{ background: (r + c) % 2 === 0 ? "#EBD0A0" : "#9C6B41" }} />
        );
      })}
    </span>
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 lg:max-w-5xl">
      <SectionHeader title={t.games.zoneTitle} subtitle={t.games.zoneSub} />

      {/* Two columns on large screens: games + chat on the left, the tall
          live-users card on the right. Single column on mobile: header →
          game cards → Game Chat → live card → record section. */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
      {/* Ludo card: four-colour accent strip + mini board + quadrant badge. */}
      <article
        className="card card-hover relative overflow-hidden p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--gold) 7%, var(--card)), var(--card) 60%)",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1"
          aria-hidden="true"
          style={{
            background: `linear-gradient(90deg, ${COLOR_HEX.red} 0 25%, ${COLOR_HEX.green} 25% 50%, ${COLOR_HEX.yellow} 50% 75%, ${COLOR_HEX.blue} 75% 100%)`,
          }}
        />
        <div className="flex items-start gap-4 sm:gap-5">
          <MiniBoard />
          <div className="min-w-0 flex-1">
            <h2 className="font-serif-d flex items-center gap-2 text-2xl font-semibold">
              <span
                className="grid h-[22px] w-[22px] shrink-0 grid-cols-2 gap-[2px] rounded-[6px] p-[2px]"
                style={{ background: "var(--surface)", boxShadow: "0 0 0 1px var(--line)" }}
                aria-hidden="true"
              >
                <span className="rounded-[2px]" style={{ background: COLOR_HEX.red }} />
                <span className="rounded-[2px]" style={{ background: COLOR_HEX.green }} />
                <span className="rounded-[2px]" style={{ background: COLOR_HEX.blue }} />
                <span className="rounded-[2px]" style={{ background: COLOR_HEX.yellow }} />
              </span>
              {t.games.ludoTitle}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.games.ludoDesc}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link href="/games/ludo/solo" className="btn btn-gold flex-1">
            <Bot size={17} aria-hidden="true" />
            {t.games.playVsComputer}
          </Link>
          <Link href="/games/ludo/friends" className="btn btn-ghost flex-1">
            <Users size={17} aria-hidden="true" />
            {t.games.playWithFriends}
          </Link>
        </div>
      </article>

      {/* Quiz Battle and Draw & Guess are both live. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <article
          className="card card-hover relative flex flex-col overflow-hidden p-5"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in srgb, #3E7BFA 8%, var(--card)), var(--card) 55%)",
          }}
        >
          {/* Oversized "?" watermark — the quiz motif. */}
          <span
            className="font-serif-d pointer-events-none absolute -top-5 right-3 text-[96px] leading-none font-bold select-none"
            style={{ color: "color-mix(in srgb, #3E7BFA 10%, transparent)" }}
            aria-hidden="true"
          >
            ?
          </span>
          <div className="relative flex items-start justify-between gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, #3E7BFA, #2FA36B)",
                boxShadow:
                  "0 0 0 3px color-mix(in srgb, #3E7BFA 18%, transparent), 0 6px 14px -6px rgba(62, 123, 250, 0.55)",
              }}
            >
              <HelpCircle size={20} aria-hidden="true" />
            </span>
          </div>
          <h3 className="font-serif-d mt-3 text-lg font-semibold">{t.games.quizTitle}</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.quizDesc}
          </p>
          <Link href="/games/quiz-battle" className="btn btn-gold mt-4 w-full">
            <Play size={17} aria-hidden="true" />
            {t.games.playVsComputer}
          </Link>
        </article>
        <article
          className="card card-hover relative flex flex-col overflow-hidden p-5"
          style={{
            borderStyle: "dashed",
            borderWidth: 2,
            borderColor: "color-mix(in srgb, var(--gold) 55%, transparent)",
            backgroundImage:
              "radial-gradient(color-mix(in srgb, var(--gold) 22%, transparent) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, #E8A90C, #E5484D)",
                outline: "2px dashed color-mix(in srgb, #E5484D 45%, transparent)",
                outlineOffset: 3,
              }}
            >
              <PencilLine size={20} aria-hidden="true" />
            </span>
          </div>
          <h3 className="font-serif-d mt-3 text-lg font-semibold">{t.games.drawTitle}</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.drawDesc}
          </p>
          <Link href="/games/draw-guess" className="btn btn-gold mt-4 w-full">
            <Play size={17} aria-hidden="true" />
            {t.games.playWithFriends}
          </Link>
        </article>

        {/* Arrows Out card: 2x2 arrow-cluster badge + purple wash + watermark arrow. */}
        <article
          className="card card-hover relative flex flex-col overflow-hidden p-5"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in srgb, #8E4EC6 8%, var(--card)), var(--card) 55%)",
          }}
        >
          {/* Oversized arrow watermark — the puzzle motif. */}
          <MoveUpRight
            size={96}
            className="pointer-events-none absolute -top-4 right-3"
            style={{ color: "color-mix(in srgb, #8E4EC6 10%, transparent)" }}
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            {/* Four direction colours, matching the in-game arrows. */}
            <span
              className="grid h-11 w-11 shrink-0 grid-cols-2 overflow-hidden rounded-full text-white"
              style={{ boxShadow: "0 6px 14px -6px rgba(142, 78, 198, 0.55)" }}
              aria-hidden="true"
            >
              <span className="flex items-center justify-center" style={{ background: "#E5484D" }}>
                <ArrowUp size={13} />
              </span>
              <span className="flex items-center justify-center" style={{ background: "#2FA36B" }}>
                <ArrowRight size={13} />
              </span>
              <span className="flex items-center justify-center" style={{ background: "#3E7BFA" }}>
                <ArrowDown size={13} />
              </span>
              <span className="flex items-center justify-center" style={{ background: "#8E4EC6" }}>
                <ArrowLeft size={13} />
              </span>
            </span>
          </div>
          <h3 className="font-serif-d mt-3 text-lg font-semibold">{t.games.arrowsTitle}</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.arrowsDesc}
          </p>
          <Link href="/games/arrows-out" className="btn btn-gold mt-4 w-full">
            <Play size={17} aria-hidden="true" />
            {t.games.playNow}
          </Link>
        </article>

        {/* Bubble Shooter card: bubble-cluster badge + blue wash + watermark bubble. */}
        <article
          className="card card-hover relative flex flex-col overflow-hidden p-5"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in srgb, #3E7BFA 8%, var(--card)), var(--card) 55%)",
          }}
        >
          {/* Oversized bubble watermark — the shooter motif. */}
          <Circle
            size={96}
            className="pointer-events-none absolute -top-4 right-3"
            style={{ color: "color-mix(in srgb, #3E7BFA 10%, transparent)" }}
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            {/* Three glossy mini bubbles in a cluster, matching the in-game palette. */}
            <span
              className="relative h-11 w-11 shrink-0"
              style={{ filter: "drop-shadow(0 6px 8px rgba(62, 123, 250, 0.35))" }}
              aria-hidden="true"
            >
              <span
                className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 rounded-full"
                style={{ background: "radial-gradient(circle at 32% 30%, #F6B0B3 0%, #E5484D 55%, #9B1C21 100%)" }}
              />
              <span
                className="absolute bottom-0 left-0 h-6 w-6 rounded-full"
                style={{ background: "radial-gradient(circle at 32% 30%, #F5D9A3 0%, #D9A044 55%, #8A5A12 100%)" }}
              />
              <span
                className="absolute bottom-0 right-0 h-6 w-6 rounded-full"
                style={{ background: "radial-gradient(circle at 32% 30%, #A8C4F8 0%, #3E7BFA 55%, #1C3F9B 100%)" }}
              />
            </span>
          </div>
          <h3 className="font-serif-d mt-3 text-lg font-semibold">{t.games.bubbleTitle}</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.bubbleDesc}
          </p>
          <Link href="/games/bubble-shooter" className="btn btn-gold mt-4 w-full">
            <Play size={17} aria-hidden="true" />
            {t.games.playNow}
          </Link>
        </article>

        {/* Chess card: checkerboard badge + crown + wood-tone wash. */}
        <article
          className="card card-hover relative flex flex-col overflow-hidden p-5"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in srgb, #9C6B41 10%, var(--card)), var(--card) 55%)",
          }}
        >
          {/* Oversized crown watermark — the chess motif. */}
          <Crown
            size={96}
            className="pointer-events-none absolute -top-4 right-3"
            style={{ color: "color-mix(in srgb, #9C6B41 12%, transparent)" }}
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            <MiniChessboard />
          </div>
          <h3 className="font-serif-d mt-3 text-lg font-semibold">{t.games.chessTitle}</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.chessDesc}
          </p>
          <Link href="/games/chess" className="btn btn-gold mt-4 w-full">
            <Play size={17} aria-hidden="true" />
            {t.games.playNow}
          </Link>
        </article>
      </div>

      {/* Game Chat stays open on the zone page — no separate page to visit. */}
      <GameChat />
        </div>

        {/* Who is live: site-wide + in the Gaming Zone, in one tall card. */}
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
  );
}
