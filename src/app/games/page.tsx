"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Gamepad2, HelpCircle, MessageCircle, PencilLine, Play, Trophy, Users } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { SectionHeader } from "@/components/ui";
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
      style={{ borderColor: "var(--line)", background: "var(--surface)" }}
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
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SectionHeader title={t.games.zoneTitle} subtitle={t.games.zoneSub} />

      {/* Ludo card */}
      <article className="card card-hover p-5 sm:p-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <MiniBoard />
          <div className="min-w-0 flex-1">
            <h2 className="font-serif-d flex items-center gap-2 text-2xl font-semibold">
              <Gamepad2 size={22} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
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

      {/* Quiz Battle and Zone Chat are live; Draw & Guess is still a placeholder: chip only, nothing clickable. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="card card-hover flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #3E7BFA, #2FA36B)" }}
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
        <article className="card card-hover flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #D9A044, #A66A19)" }}
            >
              <MessageCircle size={20} aria-hidden="true" />
            </span>
          </div>
          <h3 className="font-serif-d mt-3 text-lg font-semibold">{t.games.chatTitle}</h3>
          <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.chatDesc}
          </p>
          <Link href="/games/chat" className="btn btn-gold mt-4 w-full">
            <MessageCircle size={17} aria-hidden="true" />
            {t.games.openChat}
          </Link>
        </article>
        <article className="card p-5 opacity-70">
          <div className="flex items-start justify-between gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #E8A90C, #E5484D)" }}
            >
              <PencilLine size={20} aria-hidden="true" />
            </span>
            <span className="chip">{t.games.comingSoon}</span>
          </div>
          <h3 className="font-serif-d mt-3 text-lg font-semibold">{t.games.drawTitle}</h3>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.drawDesc}
          </p>
        </article>
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
