"use client";

/* Live games: every room game currently RUNNING across Ludo, Draw &
   Guess, Chess, Quiz Battle and Word Meaning Battle — playing rooms
   only, never waiting rooms. Everyone can watch: opening a room shows
   the spectator view (live board, no controls, no chat). A seated
   player opening their own game gets the normal player view instead —
   each room page decides by seat, so this list needs no membership
   logic of its own.

   Data paths mirror the lobbies: Ludo reads ludo_rooms directly
   (approved users can read rooms), Chess goes through
   list_chess_rooms() + get_chess_room() per playing room, Draw &
   Guess goes through list_live_draw_rooms() (migration v24), Quiz
   Battle goes through list_live_quiz_rooms() (migration v27) and
   Word Meaning Battle goes through list_live_word_rooms() (migration
   v28) — all return spectator-safe fields only. Until a migration
   runs, the matching call errors and those entries are simply absent;
   the page never crashes on it. Refresh is the same 10s poll the
   lobbies use. */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpenText, Brain, Crown, Eye, PencilLine, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { SectionHeader } from "@/components/ui";
import { LudoAvatar } from "@/components/LudoGame";
import { LOBBY_FRESH_MS, parseRoom } from "@/lib/ludo/room";
import { parseChessLobbyRoom, parseChessRoom } from "@/lib/chess/room";
import { parseLiveDrawRoom } from "@/lib/draw-guess/room";
import { parseLiveQuizRoom } from "@/lib/quiz/multiplayer";
import { parseLiveWordRoom } from "@/lib/words/multiplayer";

type LiveGame = "ludo" | "draw" | "chess" | "quiz" | "word";

interface LiveEntry {
  game: LiveGame;
  id: string;
  code: string;
  updatedAt: string;
  players: { name: string; avatar_url: string | null }[];
  href: string;
}

const GAME_DOT: Record<LiveGame, string> = {
  ludo: "#E5484D",
  draw: "#E8A90C",
  chess: "#9C6B41",
  quiz: "#3E7BFA",
  word: "#2FA36B",
};

export default function LiveGamesPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLive = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setEntries([]);
      setLoading(false);
      return;
    }
    const freshSince = new Date(Date.now() - LOBBY_FRESH_MS).toISOString();
    const found: LiveEntry[] = [];

    // Ludo: playing rooms, fresh within the hour (lobby pattern).
    const ludoRes = await supabase
      .from("ludo_rooms")
      .select("*")
      .eq("status", "playing")
      .gte("updated_at", freshSince)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (!ludoRes.error && ludoRes.data) {
      for (const row of ludoRes.data as unknown[]) {
        const room = parseRoom(row);
        if (room) {
          found.push({
            game: "ludo",
            id: room.id,
            code: room.code,
            updatedAt: room.updated_at,
            players: room.players,
            href: `/games/ludo/room/${room.id}`,
          });
        }
      }
    }

    // Chess: the lobby RPC lists waiting + playing; fetch the full
    // room (players with names/avatars) for each playing room.
    const chessRes = await supabase.rpc("list_chess_rooms");
    if (!chessRes.error && chessRes.data) {
      for (const row of chessRes.data as unknown[]) {
        const lobby = parseChessLobbyRoom(row);
        if (!lobby || lobby.status !== "playing") continue;
        const { data, error } = await supabase.rpc("get_chess_room", { p_room_id: lobby.id });
        const room = !error && data ? parseChessRoom(data) : null;
        if (room && room.status === "playing") {
          found.push({
            game: "chess",
            id: room.id,
            code: room.code,
            updatedAt: room.updated_at,
            players: room.players,
            href: `/games/chess/room/${room.id}`,
          });
        }
      }
    }

    // Draw & Guess: the live-list RPC (migration v24). Until it is
    // run, this errors — treat as "no live Draw & Guess games".
    const drawRes = await supabase.rpc("list_live_draw_rooms");
    if (!drawRes.error && drawRes.data) {
      for (const row of drawRes.data as unknown[]) {
        const room = parseLiveDrawRoom(row);
        if (room) {
          found.push({
            game: "draw",
            id: room.id,
            code: room.code,
            updatedAt: room.updated_at,
            players: room.players,
            href: `/games/draw-guess/room/${room.id}`,
          });
        }
      }
    }

    // Quiz Battle: the live-list RPC (migration v27). Until it is
    // run, this errors — treat as "no live Quiz Battle games".
    const quizRes = await supabase.rpc("list_live_quiz_rooms");
    if (!quizRes.error && quizRes.data) {
      for (const row of quizRes.data as unknown[]) {
        const room = parseLiveQuizRoom(row);
        if (room) {
          found.push({
            game: "quiz",
            id: room.id,
            code: room.code,
            updatedAt: room.updated_at,
            players: room.players,
            href: `/games/quiz-battle/room/${room.id}`,
          });
        }
      }
    }

    // Word Meaning Battle: the live-list RPC (migration v28). Until
    // it is run, this errors — treat as "no live Word Battle games".
    const wordRes = await supabase.rpc("list_live_word_rooms");
    if (!wordRes.error && wordRes.data) {
      for (const row of wordRes.data as unknown[]) {
        const room = parseLiveWordRoom(row);
        if (room) {
          found.push({
            game: "word",
            id: room.id,
            code: room.code,
            updatedAt: room.updated_at,
            players: room.players,
            href: `/games/word-battle/room/${room.id}`,
          });
        }
      }
    }

    found.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setEntries(found);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLive();
    const id = setInterval(() => void fetchLive(), 10_000);
    return () => clearInterval(id);
  }, [fetchLive]);

  const gameName = (game: LiveGame): string =>
    game === "ludo"
      ? t.liveWatch.ludoName
      : game === "draw"
        ? t.liveWatch.drawName
        : game === "quiz"
          ? t.liveWatch.quizName
          : game === "word"
            ? t.liveWatch.wordName
            : t.liveWatch.chessName;

  const gameIcon = (game: LiveGame) => {
    if (game === "draw") return <PencilLine size={13} aria-hidden="true" />;
    if (game === "chess") return <Crown size={13} aria-hidden="true" />;
    if (game === "quiz") return <Brain size={13} aria-hidden="true" />;
    if (game === "word") return <BookOpenText size={13} aria-hidden="true" />;
    return (
      <span className="grid grid-cols-2 gap-[1px]" aria-hidden="true">
        <span className="h-[5px] w-[5px] rounded-[1px]" style={{ background: "#E5484D" }} />
        <span className="h-[5px] w-[5px] rounded-[1px]" style={{ background: "#2FA36B" }} />
        <span className="h-[5px] w-[5px] rounded-[1px]" style={{ background: "#3E7BFA" }} />
        <span className="h-[5px] w-[5px] rounded-[1px]" style={{ background: "#E8A90C" }} />
      </span>
    );
  };

  const roomAge = (updatedAt: string): string => {
    const mins = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 60_000);
    return mins < 1 ? t.liveWatch.justNow : t.liveWatch.minutesAgo(mins);
  };

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.liveWatch.loading}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SectionHeader
        title={t.liveWatch.title}
        subtitle={t.liveWatch.sub}
        action={
          <button type="button" className="btn btn-ghost" onClick={() => void fetchLive()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t.liveWatch.refresh}
          </button>
        }
      />

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.liveWatch.loading}
        </p>
      ) : entries.length === 0 ? (
        <div className="card p-5">
          <p className="text-sm font-medium">{t.liveWatch.emptyTitle}</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t.liveWatch.emptyHint}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {entries.map((entry) => (
            <article key={`${entry.game}:${entry.id}`} className="card flex flex-wrap items-center gap-3 p-4">
              <span className="flex -space-x-2" aria-hidden="true">
                {entry.players.slice(0, 4).map((p, i) => (
                  <span
                    key={`${p.name}-${i}`}
                    className="rounded-full"
                    style={{ boxShadow: "0 0 0 2px var(--card)" }}
                  >
                    <LudoAvatar url={p.avatar_url} name={p.name} size={36} />
                  </span>
                ))}
                {entry.players.length > 4 && (
                  <span
                    className="font-serif-d flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "var(--surface2)", boxShadow: "0 0 0 2px var(--card)" }}
                  >
                    +{entry.players.length - 4}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold"
                    style={{ borderColor: "var(--line)", background: "var(--surface)" }}
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: GAME_DOT[entry.game] }}
                      aria-hidden="true"
                    />
                    {gameIcon(entry.game)}
                    {gameName(entry.game)}
                  </span>
                  <span className="font-mono font-bold tracking-widest">{entry.code}</span>
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse"
                    aria-hidden="true"
                  />
                </p>
                <p className="mt-1 truncate text-xs" style={{ color: "var(--muted)" }}>
                  {entry.players.map((p) => p.name).join(", ")}
                  {" · "}
                  {t.liveWatch.playersLabel(entry.players.length)}
                  {" · "}
                  {roomAge(entry.updatedAt)}
                </p>
              </div>
              <button type="button" className="btn btn-gold" onClick={() => router.push(entry.href)}>
                <Eye size={16} aria-hidden="true" />
                {t.liveWatch.watch}
              </button>
            </article>
          ))}
        </div>
      )}

      <div>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/games")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.games.backToZone}
        </button>
      </div>
    </div>
  );
}
