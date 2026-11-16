"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw, Users } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { SectionHeader } from "@/components/ui";
import { LudoAvatar } from "@/components/LudoGame";
import { COLORS } from "@/lib/ludo/engine";
import {
  COLOR_HEX,
  generateRoomCode,
  isRoomFresh,
  isValidRoomCode,
  normalizeRoomCode,
  parseRoom,
  type LudoRoom,
  type LudoRoomPlayer,
} from "@/lib/ludo/room";

type PlayerCount = 2 | 3 | 4;

type JoinResult = "ok" | "full" | "stale" | "error" | "conflict";

export default function FriendsLobbyPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<LudoRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [createCount, setCreateCount] = useState<PlayerCount>(4);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setRooms([]);
      setLoading(false);
      return;
    }
    const freshSince = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data, error: fetchError } = await supabase
      .from("ludo_rooms")
      .select("*")
      .eq("status", "waiting")
      .gte("updated_at", freshSince)
      .order("updated_at", { ascending: false })
      .limit(20);
    if (fetchError || !data) {
      setRooms([]);
    } else {
      const parsed: LudoRoom[] = [];
      for (const row of data as unknown[]) {
        const room = parseRoom(row);
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

  /** Guarded read-modify-write join: the update only lands if the room row
      is untouched since the read (updated_at match). Returns "conflict"
      when the row moved under us, so the caller can retry once. */
  const attemptJoin = useCallback(async (roomId: string): Promise<JoinResult> => {
    const supabase = getSupabase();
    if (!supabase || !session) return "error";
    const { data } = await supabase.from("ludo_rooms").select("*").eq("id", roomId).maybeSingle();
    const room = data ? parseRoom(data) : null;
    if (!room) return "error";
    if (room.players.some((p) => p.user_id === session.id)) return "ok";
    if (room.status !== "waiting" || !isRoomFresh(room, Date.now())) return "stale";
    if (room.players.length >= room.max_players) return "full";
    const me: LudoRoomPlayer = {
      user_id: session.id,
      name: session.name,
      avatar_url: session.avatar_url ?? null,
      color: COLORS[room.players.length],
    };
    const { data: updated, error: updateError } = await supabase
      .from("ludo_rooms")
      .update({ players: [...room.players, me], updated_at: new Date().toISOString() })
      .eq("id", roomId)
      .eq("updated_at", room.updated_at)
      .select("id");
    if (!updateError && updated && (updated as unknown[]).length > 0) return "ok";
    return "conflict";
  }, [session]);

  const joinRoom = useCallback(
    async (roomId: string) => {
      setJoining(true);
      setError(null);
      let result = await attemptJoin(roomId);
      if (result === "conflict") result = await attemptJoin(roomId);
      setJoining(false);
      if (result === "ok") {
        router.push(`/games/ludo/room/${roomId}`);
      } else if (result === "full" || result === "conflict") {
        setError(t.ludo.roomFull);
        void fetchRooms();
      } else if (result === "stale") {
        setError(t.ludo.roomStale);
        void fetchRooms();
      } else {
        setError(t.ludo.joinFailed);
      }
    },
    [attemptJoin, fetchRooms, router, t],
  );

  const createRoom = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) {
      setError(t.ludo.createFailed);
      return;
    }
    setCreating(true);
    setError(null);
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error: insertError } = await supabase
        .from("ludo_rooms")
        .insert({
          code: generateRoomCode(),
          host_id: session.id,
          status: "waiting",
          max_players: createCount,
          players: [
            {
              user_id: session.id,
              name: session.name,
              avatar_url: session.avatar_url ?? null,
              color: "red",
            },
          ],
          state: null,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .maybeSingle();
      if (!insertError && data) {
        router.push(`/games/ludo/room/${(data as { id: string }).id}`);
        return;
      }
      if (insertError && insertError.code !== "23505") break;
    }
    setCreating(false);
    setError(t.ludo.createFailed);
  }, [createCount, router, session, t]);

  const joinByCode = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) {
      setError(t.ludo.joinFailed);
      return;
    }
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError(t.ludo.roomNotFound);
      return;
    }
    setJoining(true);
    setError(null);
    const { data } = await supabase.from("ludo_rooms").select("id").eq("code", normalized).maybeSingle();
    setJoining(false);
    if (!data) {
      setError(t.ludo.roomNotFound);
      return;
    }
    void joinRoom((data as { id: string }).id);
  }, [code, joinRoom, session, t]);

  const roomAge = (room: LudoRoom): string => {
    const mins = Math.floor((Date.now() - new Date(room.updated_at).getTime()) / 60_000);
    return mins < 1 ? t.ludo.justNow : t.ludo.minutesAgo(mins);
  };

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.ludo.loading}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SectionHeader
        title={t.ludo.lobbyTitle}
        subtitle={t.ludo.lobbySub}
        action={
          <button type="button" className="btn btn-ghost" onClick={() => void fetchRooms()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t.ludo.refresh}
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
          {t.ludo.createRoom}
        </h2>
        <p className="mt-2 text-sm font-medium">{t.ludo.choosePlayers}</p>
        <div className="mt-2 grid max-w-xs grid-cols-3 gap-2" role="group" aria-label={t.ludo.choosePlayers}>
          {([2, 3, 4] as PlayerCount[]).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCreateCount(n)}
              aria-pressed={createCount === n}
              className={`btn ${createCount === n ? "btn-active" : "btn-ghost"}`}
            >
              {t.ludo.playersLabel(n)}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-gold mt-4" onClick={() => void createRoom()} disabled={creating}>
          {creating ? t.ludo.creating : t.ludo.createRoom}
        </button>
      </section>

      {/* Join by code */}
      <section className="card p-5">
        <h2 className="font-serif-d text-lg font-semibold">{t.ludo.joinByCode}</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t.ludo.codePh}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] uppercase outline-none"
            style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
          />
          <button type="button" className="btn btn-gold" onClick={() => void joinByCode()} disabled={joining}>
            {joining ? t.ludo.joining : t.ludo.join}
          </button>
        </div>
      </section>

      {/* Open rooms */}
      <section>
        <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
          <Users size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          {t.ludo.openRooms}
        </h2>
        {loading ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.ludo.loading}
          </p>
        ) : rooms.length === 0 ? (
          <div className="card mt-3 p-5">
            <p className="text-sm font-medium">{t.ludo.noRooms}</p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {t.ludo.noRoomsHint}
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {rooms.map((room) => {
              const creator = room.players[0];
              const isMember = room.players.some((p) => p.user_id === session.id);
              const full = room.players.length >= room.max_players;
              return (
                <article key={room.id} className="card flex flex-wrap items-center gap-3 p-4">
                  {creator && <LudoAvatar url={creator.avatar_url} name={creator.name} size={40} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {creator ? t.ludo.createdBy(creator.name) : room.code}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="font-mono font-bold tracking-widest" style={{ color: "var(--text)" }}>
                        {room.code}
                      </span>
                      <span>{t.ludo.seatsTaken(room.players.length, room.max_players)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{roomAge(room)}</span>
                      <span className="flex gap-1" aria-hidden="true">
                        {room.players.map((p) => (
                          <span
                            key={p.user_id}
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ background: COLOR_HEX[p.color] }}
                          />
                        ))}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-gold"
                    disabled={joining || (full && !isMember)}
                    onClick={() => void joinRoom(room.id)}
                  >
                    {joining ? t.ludo.joining : t.ludo.join}
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
