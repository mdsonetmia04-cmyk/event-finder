"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PencilLine, Plus, RefreshCw, Users } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { SectionHeader } from "@/components/ui";
import { LudoAvatar } from "@/components/LudoGame";
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from "@/lib/ludo/room";
import {
  isDrawRoomFresh,
  parseDrawLobbyRoom,
  parseDrawRoom,
  parseDrawRoomLookup,
  type DrawLobbyRoom,
} from "@/lib/draw-guess/room";

type PlayerCount = 2 | 3 | 4 | 5 | 6;

export default function DrawGuessLobbyPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<DrawLobbyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createCount, setCreateCount] = useState<PlayerCount>(4);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Lobby listing goes through the list_draw_rooms() RPC — direct
     SELECT on draw_rooms is denied so the secret word can never leak. */
  const fetchRooms = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setRooms([]);
      setLoading(false);
      return;
    }
    const { data, error: fetchError } = await supabase.rpc("list_draw_rooms");
    if (fetchError || !data) {
      setRooms([]);
    } else {
      const parsed: DrawLobbyRoom[] = [];
      for (const row of data as unknown[]) {
        const room = parseDrawLobbyRoom(row);
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
        setError(t.draw.joinFailed);
        return;
      }
      setJoining(true);
      setError(null);
      const { data, error: joinError } = await supabase.rpc("join_draw_room", { p_room_id: roomId });
      setJoining(false);
      if (!joinError && data === true) {
        router.push(`/games/draw-guess/room/${roomId}`);
      } else {
        setError(t.draw.joinFailed);
        void fetchRooms();
      }
    },
    [fetchRooms, router, session, t],
  );

  const createRoom = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) {
      setError(t.draw.createFailed);
      return;
    }
    setCreating(true);
    setError(null);
    // A code collision returns null, so retry with a fresh code.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: insertError } = await supabase.rpc("create_draw_room", {
        p_code: generateRoomCode(),
        p_max_players: createCount,
      });
      if (!insertError && typeof data === "string" && data) {
        router.push(`/games/draw-guess/room/${data}`);
        return;
      }
    }
    setCreating(false);
    setError(t.draw.createFailed);
  }, [createCount, router, session, t]);

  const joinByCode = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) {
      setError(t.draw.joinFailed);
      return;
    }
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError(t.draw.roomNotFound);
      return;
    }
    setJoining(true);
    setError(null);
    const { data, error: findError } = await supabase.rpc("find_draw_room", { p_code: normalized });
    if (findError || !data) {
      setJoining(false);
      setError(t.draw.joinFailed);
      return;
    }
    const rows = data as unknown[];
    const found = rows.length > 0 ? parseDrawRoomLookup(rows[0]) : null;
    setJoining(false);
    if (!found) {
      setError(t.draw.roomNotFound);
      return;
    }
    if (found.status === "playing" || found.status === "finished") {
      // A seated player who left the room page can come back via the
      // code; anyone else gets a clear message, not a stale-room error.
      const { data: roomData, error: roomError } = await supabase.rpc("get_draw_room", {
        p_room_id: found.id,
      });
      const room = !roomError && roomData ? parseDrawRoom(roomData) : null;
      if (room && room.players.some((pl) => pl.user_id === session.id)) {
        router.push(`/games/draw-guess/room/${found.id}`);
      } else {
        setError(found.status === "playing" ? t.draw.gameStarted : t.draw.gameFinished);
      }
      return;
    }
    if (!isDrawRoomFresh(found.updated_at, Date.now())) {
      setError(t.draw.roomStale);
      return;
    }
    if (found.player_count >= found.max_players) {
      setError(t.draw.roomFull);
      return;
    }
    void joinRoom(found.id);
  }, [code, joinRoom, router, session, t]);

  const roomAge = (room: DrawLobbyRoom): string => {
    const mins = Math.floor((Date.now() - new Date(room.updated_at).getTime()) / 60_000);
    return mins < 1 ? t.draw.justNow : t.draw.minutesAgo(mins);
  };

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.draw.loading}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SectionHeader
        title={t.draw.lobbyTitle}
        subtitle={t.draw.lobbySub}
        action={
          <button type="button" className="btn btn-ghost" onClick={() => void fetchRooms()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t.draw.refresh}
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
          {t.draw.createRoom}
        </h2>
        <p className="mt-2 text-sm font-medium">{t.draw.choosePlayers}</p>
        <div className="mt-2 flex max-w-sm flex-wrap gap-2" role="group" aria-label={t.draw.choosePlayers}>
          {([2, 3, 4, 5, 6] as PlayerCount[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCreateCount(n)}
              aria-pressed={createCount === n}
              className={`btn flex-1 ${createCount === n ? "btn-active" : "btn-ghost"}`}
            >
              {t.draw.playersLabel(n)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {t.draw.roundsNote(createCount)}
        </p>
        <button type="button" className="btn btn-gold mt-4" onClick={() => void createRoom()} disabled={creating}>
          <PencilLine size={17} aria-hidden="true" />
          {creating ? t.draw.creating : t.draw.createRoom}
        </button>
      </section>

      {/* Join by code */}
      <section className="card p-5">
        <h2 className="font-serif-d text-lg font-semibold">{t.draw.joinByCode}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t.draw.codePh}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] uppercase outline-none"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
          />
          <button type="button" className="btn btn-gold" onClick={() => void joinByCode()} disabled={joining}>
            {joining ? t.draw.joining : t.draw.join}
          </button>
        </div>
      </section>

      {/* Open rooms */}
      <section>
        <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
          <Users size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          {t.draw.openRooms}
        </h2>
        {loading ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.draw.loading}
          </p>
        ) : rooms.length === 0 ? (
          <div className="card mt-3 p-5">
            <p className="text-sm font-medium">{t.draw.noRooms}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {t.draw.noRoomsHint}
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
                      {room.host_name ? t.draw.createdBy(room.host_name) : room.code}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="font-mono font-bold tracking-widest" style={{ color: "var(--text)" }}>
                        {room.code}
                      </span>
                      <span>{t.draw.seatsTaken(room.player_count, room.max_players)}</span>
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
                    {joining ? t.draw.joining : t.draw.join}
                  </button>
                </article>
              );
            })}
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
