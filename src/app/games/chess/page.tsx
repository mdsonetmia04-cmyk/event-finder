"use client";

/* Chess lobby: play Sweet AI, create a 2-player room, join by code,
   or watch an open room as a spectator. Joining by code is the only
   way to take a seat — clicking an open room only watches. */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, Crown, Eye, Plus, RefreshCw, Users } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { SectionHeader } from "@/components/ui";
import { LudoAvatar } from "@/components/LudoGame";
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from "@/lib/ludo/room";
import {
  isChessRoomFresh,
  parseChessLobbyRoom,
  parseChessRoomLookup,
  type ChessLobbyRoom,
} from "@/lib/chess/room";

export default function ChessLobbyPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChessLobbyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Lobby listing goes through the list_chess_rooms() RPC: waiting +
     playing rooms, fresh within the hour. */
  const fetchRooms = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setRooms([]);
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase.rpc("list_chess_rooms");
    if (fetchError || !data) {
      setRooms([]);
    } else {
      const parsed: ChessLobbyRoom[] = [];
      for (const row of data as unknown[]) {
        const room = parseChessLobbyRoom(row);
        if (room) parsed.push(room);
      }
      setRooms(parsed);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchRooms();
    const id = setInterval(() => void fetchRooms(), 10_000);
    return () => clearInterval(id);
  }, [fetchRooms]);

  const joinRoom = useCallback(
    async (roomId: string) => {
      const supabase = getSupabase();
      if (!supabase || !session) {
        setError(t.chess.joinFailed);
        return;
      }
      setJoining(true);
      setError(null);
      const { data, error: joinError } = await supabase.rpc("join_chess_room", { p_room_id: roomId });
      setJoining(false);
      if (!joinError && data === true) {
        router.push(`/games/chess/room/${roomId}`);
      } else {
        setError(t.chess.joinFailed);
        void fetchRooms();
      }
    },
    [fetchRooms, router, session, t],
  );

  const createRoom = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) {
      setError(t.chess.createFailed);
      return;
    }
    setCreating(true);
    setError(null);
    // A code collision returns null, so retry with a fresh code.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: insertError } = await supabase.rpc("create_chess_room", {
        p_code: generateRoomCode(),
      });
      if (!insertError && typeof data === "string" && data) {
        router.push(`/games/chess/room/${data}`);
        return;
      }
    }
    setCreating(false);
    setError(t.chess.createFailed);
  }, [router, session, t]);

  const joinByCode = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) {
      setError(t.chess.joinFailed);
      return;
    }
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError(t.chess.roomNotFound);
      return;
    }
    setJoining(true);
    setError(null);
    const { data, error: findError } = await supabase.rpc("find_chess_room", { p_code: normalized });
    if (findError || !data) {
      setJoining(false);
      setError(t.chess.joinFailed);
      return;
    }
    const rows = data as unknown[];
    const found = rows.length > 0 ? parseChessRoomLookup(rows[0]) : null;
    setJoining(false);
    if (!found) {
      setError(t.chess.roomNotFound);
      return;
    }
    if (found.status === "playing" || found.status === "finished") {
      // Seated players re-enter; anyone else watches the live game
      // or the final board. The room page decides which view.
      router.push(`/games/chess/room/${found.id}`);
      return;
    }
    if (!isChessRoomFresh(found.updated_at, Date.now())) {
      setError(t.chess.roomStale);
      return;
    }
    if (found.player_count >= 2) {
      setError(t.chess.roomFull);
      return;
    }
    void joinRoom(found.id);
  }, [code, joinRoom, router, session, t]);

  const roomAge = (room: ChessLobbyRoom): string => {
    const mins = Math.floor((Date.now() - new Date(room.updated_at).getTime()) / 60_000);
    return mins < 1 ? t.chess.justNow : t.chess.minutesAgo(mins);
  };

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.chess.loading}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SectionHeader
        title={t.chess.lobbyTitle}
        subtitle={t.chess.lobbySub}
        action={
          <button type="button" className="btn btn-ghost" onClick={() => void fetchRooms()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t.chess.refresh}
          </button>
        }
      />

      {error && (
        <p role="alert" className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
          {error}
        </p>
      )}

      {/* Vs Sweet AI */}
      <section className="card p-5">
        <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
          <Bot size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          {t.chess.vsAiTitle}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t.chess.vsAiDesc}
        </p>
        <Link href="/games/chess/solo" className="btn btn-gold mt-4">
          <Crown size={17} aria-hidden="true" />
          {t.games.playVsComputer}
        </Link>
      </section>

      {/* Create room */}
      <section className="card p-5">
        <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
          <Plus size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          {t.chess.createRoom}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t.chess.shareHint}
        </p>
        <button type="button" className="btn btn-gold mt-4" onClick={() => void createRoom()} disabled={creating}>
          {creating ? t.chess.creating : t.chess.createRoom}
        </button>
      </section>

      {/* Join by code */}
      <section className="card p-5">
        <h2 className="font-serif-d text-lg font-semibold">{t.chess.joinByCode}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t.chess.codePh}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] uppercase outline-none"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
          />
          <button type="button" className="btn btn-gold" onClick={() => void joinByCode()} disabled={joining}>
            {joining ? t.chess.joining : t.chess.join}
          </button>
        </div>
      </section>

      {/* Open rooms — watching only; seats come from the code. */}
      <section>
        <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
          <Users size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          {t.chess.openRooms}
        </h2>
        {loading ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.chess.loading}
          </p>
        ) : rooms.length === 0 ? (
          <div className="card mt-3 p-5">
            <p className="text-sm font-medium">{t.chess.noRooms}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {t.chess.noRoomsHint}
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {rooms.map((room) => (
              <article key={room.id} className="card flex flex-wrap items-center gap-3 p-4">
                <LudoAvatar url={null} name={room.host_name ?? room.code} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {room.host_name ? t.chess.createdBy(room.host_name) : room.code}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                    <span className="font-mono font-bold tracking-widest" style={{ color: "var(--text)" }}>
                      {room.code}
                    </span>
                    <span>{t.chess.seatsTaken(room.player_count, 2)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{room.status === "playing" ? t.chess.statusPlaying : t.chess.statusWaiting}</span>
                    <span aria-hidden="true">·</span>
                    <span>{roomAge(room)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => router.push(`/games/chess/room/${room.id}`)}
                >
                  <Eye size={16} aria-hidden="true" />
                  {t.chess.watch}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <div>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/games")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.games.backToZone}
        </button>
      </div>
    </div>
  );
}
