"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw, Users, Zap } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { SectionHeader } from "@/components/ui";
import { LudoAvatar } from "@/components/LudoGame";
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from "@/lib/ludo/room";
import {
  isWordRoomFresh,
  parseWordLobbyRoom,
  parseWordRoom,
  parseWordRoomLookup,
  type WordLobbyRoom,
} from "@/lib/words/multiplayer";

type PlayerCount = 2 | 3 | 4;

/** Multiplayer Word Meaning Battle lobby — create a room, join with a
    code, or pick an open room. Rendered as a mode of the Word Battle
    page (never a top-level nav item). Mirrors the Quiz Battle lobby. */
export default function WordMultiplayer({ onExit }: { onExit: () => void }) {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<WordLobbyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createCount, setCreateCount] = useState<PlayerCount>(4);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Lobby listing goes through the list_word_rooms() RPC — direct
     SELECT on word_rooms is denied so the correct answers can never
     leak. */
  const fetchRooms = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setRooms([]);
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase.rpc("list_word_rooms");
    if (fetchError || !data) {
      setRooms([]);
    } else {
      const parsed: WordLobbyRoom[] = [];
      for (const row of data as unknown[]) {
        const room = parseWordLobbyRoom(row);
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
        setError(t.word.multi.joinFailed);
        return;
      }
      setJoining(true);
      setError(null);
      const { data, error: joinError } = await supabase.rpc("join_word_room", { p_room_id: roomId });
      setJoining(false);
      if (!joinError && data === true) {
        router.push(`/games/word-battle/room/${roomId}`);
      } else {
        setError(t.word.multi.joinFailed);
        void fetchRooms();
      }
    },
    [fetchRooms, router, session, t],
  );

  const createRoom = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) {
      setError(t.word.multi.createFailed);
      return;
    }
    setCreating(true);
    setError(null);
    // A code collision returns null, so retry with a fresh code.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: insertError } = await supabase.rpc("create_word_room", {
        p_code: generateRoomCode(),
        p_max_players: createCount,
      });
      if (!insertError && typeof data === "string" && data) {
        router.push(`/games/word-battle/room/${data}`);
        return;
      }
    }
    setCreating(false);
    setError(t.word.multi.createFailed);
  }, [createCount, router, session, t]);

  const joinByCode = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) {
      setError(t.word.multi.joinFailed);
      return;
    }
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError(t.word.multi.roomNotFound);
      return;
    }
    setJoining(true);
    setError(null);
    const { data, error: findError } = await supabase.rpc("find_word_room", { p_code: normalized });
    if (findError || !data) {
      setJoining(false);
      setError(t.word.multi.joinFailed);
      return;
    }
    const rows = data as unknown[];
    const found = rows.length > 0 ? parseWordRoomLookup(rows[0]) : null;
    setJoining(false);
    if (!found) {
      setError(t.word.multi.roomNotFound);
      return;
    }
    if (found.status === "playing" || found.status === "finished") {
      // A seated player who left the room page can come back via the
      // code; anyone else gets a clear message, not a stale-room error.
      const { data: roomData, error: roomError } = await supabase.rpc("get_word_room", {
        p_room_id: found.id,
      });
      const room = !roomError && roomData ? parseWordRoom(roomData) : null;
      if (room && room.players.some((pl) => pl.user_id === session.id)) {
        router.push(`/games/word-battle/room/${found.id}`);
      } else {
        setError(found.status === "playing" ? t.word.multi.gameStarted : t.word.multi.gameFinished);
      }
      return;
    }
    if (!isWordRoomFresh(found.updated_at, Date.now())) {
      setError(t.word.multi.roomStale);
      return;
    }
    if (found.player_count >= found.max_players) {
      setError(t.word.multi.roomFull);
      return;
    }
    void joinRoom(found.id);
  }, [code, joinRoom, router, session, t]);

  const roomAge = (room: WordLobbyRoom): string => {
    const mins = Math.floor((Date.now() - new Date(room.updated_at).getTime()) / 60_000);
    return mins < 1 ? t.word.multi.justNow : t.word.multi.minutesAgo(mins);
  };

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.word.multi.loading}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SectionHeader
        title={t.word.multi.lobbyTitle}
        subtitle={t.word.multi.lobbySub}
        action={
          <button type="button" className="btn btn-ghost" onClick={() => void fetchRooms()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t.word.multi.refresh}
          </button>
        }
      />

      {error && (
        <p role="alert" className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
          {error}
        </p>
      )}

      {/* Create room */}
      <section className="card p-5">
        <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
          <Plus size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          {t.word.multi.createRoom}
        </h2>
        <p className="mt-2 text-sm font-medium">{t.word.multi.choosePlayers}</p>
        <div className="mt-2 flex max-w-sm flex-wrap gap-2" role="group" aria-label={t.word.multi.choosePlayers}>
          {([2, 3, 4] as PlayerCount[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCreateCount(n)}
              aria-pressed={createCount === n}
              className={`btn flex-1 ${createCount === n ? "btn-active" : "btn-ghost"}`}
            >
              {t.word.multi.playersLabel(n)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {t.word.multi.matchNote}
        </p>
        <button type="button" className="btn btn-gold mt-4" onClick={() => void createRoom()} disabled={creating}>
          <Zap size={17} aria-hidden="true" />
          {creating ? t.word.multi.creating : t.word.multi.createRoom}
        </button>
      </section>

      {/* Join by code */}
      <section className="card p-5">
        <h2 className="font-serif-d text-lg font-semibold">{t.word.multi.joinByCode}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t.word.multi.codePh}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] uppercase outline-none"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
          />
          <button type="button" className="btn btn-gold" onClick={() => void joinByCode()} disabled={joining}>
            {joining ? t.word.multi.joining : t.word.multi.join}
          </button>
        </div>
      </section>

      {/* Open rooms */}
      <section>
        <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
          <Users size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          {t.word.multi.openRooms}
        </h2>
        {loading ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.word.multi.loading}
          </p>
        ) : rooms.length === 0 ? (
          <div className="card mt-3 p-5">
            <p className="text-sm font-medium">{t.word.multi.noRooms}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {t.word.multi.noRoomsHint}
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {rooms.map((room) => {
              const full = room.player_count >= room.max_players;
              return (
                <article key={room.id} className="card flex flex-wrap items-center gap-3 p-4">
                  <LudoAvatar url={null} name={room.host_name ?? room.code} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {room.host_name ? t.word.multi.createdBy(room.host_name) : room.code}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="font-mono font-bold tracking-widest" style={{ color: "var(--text)" }}>
                        {room.code}
                      </span>
                      <span>{t.word.multi.seatsTaken(room.player_count, room.max_players)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{roomAge(room)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-gold"
                    disabled={joining || full}
                    onClick={() => void joinRoom(room.id)}
                  >
                    {joining ? t.word.multi.joining : t.word.multi.join}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div>
        <button type="button" className="btn btn-ghost" onClick={onExit}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.word.multi.backToSetup}
        </button>
      </div>
    </div>
  );
}
