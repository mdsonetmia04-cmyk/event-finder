"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Eye, LogOut, Play, Send, Users } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import LudoGame, { LudoAvatar, type LudoPlayerMeta } from "@/components/LudoGame";
import {
  applyMove,
  applyRoll,
  botMove,
  COLORS,
  createGame,
  legalMoves,
  rollDie,
  type LudoState,
} from "@/lib/ludo/engine";
import {
  COLOR_HEX,
  isRoomFresh,
  normalizeRoomCode,
  parseMessage,
  parseRoom,
  seatIndex,
  type LudoMessage,
  type LudoRoom,
  type LudoRoomPlayer,
} from "@/lib/ludo/room";

const POLL_MS = 2000;
const CHAT_LIMIT = 50;
const QUICK_EMOJIS = ["😆", "👏", "😮", "😢", "🎉"];

function RoomChat({
  messages,
  sessionId,
  onSend,
}: {
  messages: LudoMessage[];
  sessionId: string;
  onSend: (body: string) => Promise<boolean>;
}) {
  const { t } = useLang();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const ok = await onSend(trimmed);
    if (ok) setBody("");
    setSending(false);
  };

  return (
    <section className="card flex flex-col p-4">
      <h2 className="font-serif-d text-lg font-semibold">{t.ludo.chatTitle}</h2>
      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
        {t.ludo.chatHint}
      </p>
      <div ref={scrollRef} className="mt-3 max-h-64 min-h-24 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t.ludo.chatEmpty}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === sessionId;
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <LudoAvatar url={m.avatar_url} name={m.name} size={28} />
                <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                  <p className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>
                    {m.name}
                  </p>
                  <p
                    className="mt-0.5 inline-block break-words rounded-2xl px-3 py-1.5 text-sm"
                    style={{
                      background: mine ? "var(--gold)" : "var(--surface2)",
                      color: mine ? "#FFF9EC" : "var(--text)",
                    }}
                  >
                    {m.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="mt-3 flex gap-1.5" aria-label="Quick reactions">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="rounded-full border px-2.5 py-1 text-base transition-transform hover:scale-110 active:scale-95"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            onClick={() => void send(emoji)}
            disabled={sending}
          >
            {emoji}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(body);
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.ludo.chatPh}
          maxLength={200}
          className="min-w-0 flex-1 rounded-full border px-4 py-2 text-sm outline-none"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
        />
        <button type="submit" className="btn btn-gold shrink-0" disabled={sending || body.trim().length === 0}>
          <Send size={15} aria-hidden="true" />
          {t.ludo.chatSend}
        </button>
      </form>
    </section>
  );
}

type LoadStatus = "loading" | "ready" | "gone";

export default function RoomPage() {
  const params = useParams();
  const rawId = params.id;
  const roomId = typeof rawId === "string" ? rawId : "";
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();
  /* Stable id for fetchAll's deps: the session object identity must
     never restart the poll interval. */
  const sessionId = session?.id ?? null;

  const [room, setRoom] = useState<LudoRoom | null>(null);
  const [messages, setMessages] = useState<LudoMessage[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [goneStarted, setGoneStarted] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");

  const roomRef = useRef<LudoRoom | null>(null);
  const fetchingRef = useRef(false);
  const autoPassRef = useRef(-1);
  const handledTimeoutRef = useRef(-1);
  const wasWaitingRef = useRef(false);
  const codeTextRef = useRef<HTMLSpanElement>(null);
  const diceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (diceTimerRef.current !== null) window.clearTimeout(diceTimerRef.current);
    };
  }, []);

  const fetchAll = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const roomRes = await supabase.from("ludo_rooms").select("*").eq("id", roomId).maybeSingle();
      if (!roomRes.error) {
        const freshRoom = roomRes.data ? parseRoom(roomRes.data) : null;
        if (!freshRoom) {
          setGoneStarted(wasWaitingRef.current);
          setStatus("gone");
        } else {
          const prev = roomRef.current;
          const changed =
            !prev ||
            prev.updated_at !== freshRoom.updated_at ||
            prev.status !== freshRoom.status ||
            prev.players.length !== freshRoom.players.length ||
            JSON.stringify(prev.state) !== JSON.stringify(freshRoom.state);
          if (changed) {
            roomRef.current = freshRoom;
            setRoom(freshRoom);
          }
          if (freshRoom.status === "waiting") wasWaitingRef.current = true;
          setStatus("ready");
        }
      }
      /* Room chat is players-only: fetch messages only when the viewer
         holds a seat. Spectators never fetch them (the RLS policies
         would deny them anyway) and never see the chat UI. The cached
         room covers a failed room fetch, so a transient error can't
         leak messages to a spectator or hide them from a player. */
      const knownRoom = roomRef.current;
      const memberNow =
        !!sessionId && !!knownRoom && knownRoom.players.some((p) => p.user_id === sessionId);
      if (memberNow) {
        const msgRes = await supabase
          .from("ludo_messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false })
          .limit(CHAT_LIMIT);
        if (!msgRes.error && msgRes.data) {
          const parsed: LudoMessage[] = [];
          for (const row of msgRes.data as unknown[]) {
            const m = parseMessage(row);
            if (m) parsed.push(m);
          }
          parsed.reverse();
          setMessages((prev) => {
            if (prev.length === parsed.length && prev[prev.length - 1]?.id === parsed[parsed.length - 1]?.id) {
              return prev;
            }
            return parsed;
          });
        }
      } else {
        setMessages((prev) => (prev.length === 0 ? prev : []));
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [roomId, sessionId]);

  useEffect(() => {
    if (status === "gone") return;
    void fetchAll();
    const id = setInterval(() => {
      if (!document.hidden) void fetchAll();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll, status]);

  const applyLocal = useCallback((next: LudoState) => {
    const prev = roomRef.current;
    if (!prev) return;
    const updated: LudoRoom = {
      ...prev,
      state: next,
      updated_at: new Date().toISOString(),
      ...(next.phase === "finished" && next.winner !== null
        ? { status: "finished" as const, winner_id: prev.players[next.winner]?.user_id ?? null }
        : {}),
    };
    roomRef.current = updated;
    setRoom(updated);
  }, []);

  type Rebuild = (fresh: LudoState) => LudoState | null;

  /**
   * Guarded state write: only lands when the row still holds
   * expectedMoveNo. On conflict, refetches once and retries once via
   * rebuild; losers of the auto-play race refetch silently.
   */
  const submitState = useCallback(
    async (next: LudoState, expectedMoveNo: number, rebuild?: Rebuild, silent = false): Promise<boolean> => {
      const supabase = getSupabase();
      if (!supabase || !roomRef.current) return false;
      if (next.move_no === expectedMoveNo) return false; // engine no-op
      const attempt = async (stateToWrite: LudoState, moveNo: number) => {
        const payload: Record<string, unknown> = {
          state: stateToWrite,
          updated_at: new Date().toISOString(),
        };
        if (stateToWrite.phase === "finished" && stateToWrite.winner !== null) {
          payload.status = "finished";
          payload.winner_id = roomRef.current?.players[stateToWrite.winner]?.user_id ?? null;
        }
        return supabase
          .from("ludo_rooms")
          .update(payload)
          .eq("id", roomId)
          .eq("state->>move_no", String(moveNo))
          .select("id");
      };
      const { data, error } = await attempt(next, expectedMoveNo);
      if (!error && data && (data as unknown[]).length > 0) {
        applyLocal(next);
        setSyncError(false);
        return true;
      }
      const { data: freshRow } = await supabase.from("ludo_rooms").select("*").eq("id", roomId).maybeSingle();
      const freshRoom = freshRow ? parseRoom(freshRow) : null;
      if (freshRoom) {
        roomRef.current = freshRoom;
        setRoom(freshRoom);
      }
      if (rebuild && freshRoom?.state) {
        const retryState = rebuild(freshRoom.state);
        if (retryState && retryState.move_no !== freshRoom.state.move_no) {
          const retry = await attempt(retryState, freshRoom.state.move_no);
          if (!retry.error && retry.data && (retry.data as unknown[]).length > 0) {
            applyLocal(retryState);
            setSyncError(false);
            return true;
          }
        } else {
          return false; // state already advanced past our move
        }
      }
      if (!silent) setSyncError(true);
      return false;
    },
    [applyLocal, roomId],
  );

  const mySeat = room && session ? seatIndex(room, session.id) : -1;
  const isHost = room?.host_id === session?.id;
  const isMember = mySeat !== -1;
  const state = room?.state ?? null;

  const handleRoll = async () => {
    const cur = roomRef.current;
    const st = cur?.state;
    if (!cur || !st || !session || st.phase !== "roll" || seatIndex(cur, session.id) !== st.turn) return;
    const myIdx = st.turn;
    const moveNo = st.move_no;
    if (diceTimerRef.current !== null) window.clearTimeout(diceTimerRef.current);
    setDiceRolling(true);
    const roll = rollDie();
    try {
      await submitState(applyRoll(st, roll), moveNo, (fresh) =>
        fresh.move_no === moveNo && fresh.phase === "roll" && fresh.turn === myIdx
          ? applyRoll(fresh, roll)
          : null,
      );
    } finally {
      // The dice must always settle, even if the write throws.
      diceTimerRef.current = window.setTimeout(() => setDiceRolling(false), 800);
    }
  };

  const handleToken = (token: number) => {
    const cur = roomRef.current;
    const st = cur?.state;
    if (!cur || !st || st.phase !== "move") return;
    // The rebuild only applies to the same move: never replay this
    // tap onto a later turn after a write conflict.
    void submitState(applyMove(st, { token }), st.move_no, (fresh) =>
      fresh.move_no === st.move_no ? applyMove(fresh, { token }) : null,
    );
  };

  /* After a roll with zero legal moves, the acting client auto-passes. */
  useEffect(() => {
    if (!room || !state || !session) return;
    if (state.phase !== "move" || state.roll === null) return;
    if (seatIndex(room, session.id) !== state.turn) return;
    if (legalMoves(state, state.roll).length > 0) return;
    if (autoPassRef.current === state.move_no) return;
    autoPassRef.current = state.move_no;
    const id = window.setTimeout(() => {
      const latest = roomRef.current?.state;
      if (!latest || latest.move_no !== state.move_no) return;
      // The rebuild re-checks the pass is still correct on the fresh
      // state: same move, same roll, still zero legal moves.
      void submitState(applyMove(latest, { token: null }), latest.move_no, (fresh) =>
        fresh.move_no === latest.move_no &&
        fresh.phase === "move" &&
        fresh.roll !== null &&
        legalMoves(fresh, fresh.roll).length === 0
          ? applyMove(fresh, { token: null })
          : null,
      );
    }, 900);
    return () => window.clearTimeout(id);
  }, [room, state, session, submitState]);

  /* Timeout auto-play: every client runs the timer; the guarded write
     lets exactly one client land the auto-played turn. A failed write
     (e.g. transient network) retries while the turn is unchanged, so
     an AFK player's turn can never stall the game. */
  const handleTimeout = useCallback(() => {
    const cur = roomRef.current;
    const st = cur?.state;
    if (!cur || !st || st.phase === "finished") return;
    if (handledTimeoutRef.current === st.move_no) return;
    handledTimeoutRef.current = st.move_no;
    void (async () => {
      await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 600));
      for (let attemptNo = 0; attemptNo < 3; attemptNo++) {
        const latest = roomRef.current;
        if (!latest?.state || latest.state.move_no !== st.move_no) return;
        let auto = latest.state;
        const startTurn = auto.turn;
        /* 40 steps covers a long extra-turn streak (6/capture/home);
           the loop always ends when the turn passes or the game ends. */
        for (let i = 0; i < 40; i++) {
          if (auto.phase === "finished" || auto.turn !== startTurn) break;
          if (auto.phase === "roll") auto = applyRoll(auto, rollDie());
          else if (auto.phase === "move" && auto.roll !== null) {
            auto = applyMove(auto, { token: botMove(auto, auto.roll) });
          } else break;
        }
        if (auto.move_no === st.move_no) return;
        const ok = await submitState(auto, st.move_no, undefined, true);
        if (ok) {
          void fetchAll();
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    })();
  }, [fetchAll, submitState]);

  const startGame = async () => {
    const cur = roomRef.current;
    const supabase = getSupabase();
    if (!cur || !supabase || !session || cur.host_id !== session.id) return;
    if (cur.players.length !== cur.max_players) return;
    setStarting(true);
    const count = cur.max_players === 2 ? 2 : cur.max_players === 3 ? 3 : 4;
    const { data, error } = await supabase
      .from("ludo_rooms")
      .update({ state: createGame(count), status: "playing", updated_at: new Date().toISOString() })
      .eq("id", roomId)
      .eq("status", "waiting")
      .select("id");
    setStarting(false);
    if (!error && data && (data as unknown[]).length > 0) void fetchAll();
  };

  const leaveWaiting = async () => {
    const cur = roomRef.current;
    const supabase = getSupabase();
    if (!cur || !supabase || !session) return;
    setLeaving(true);
    if (cur.host_id === session.id) {
      await supabase.from("ludo_rooms").delete().eq("id", roomId);
    } else {
      await supabase
        .from("ludo_rooms")
        .update({
          players: cur.players.filter((p) => p.user_id !== session.id),
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId)
        .eq("status", "waiting");
    }
    router.push("/games/ludo/friends");
  };

  const joinThisRoom = async () => {
    const supabase = getSupabase();
    const cur = roomRef.current;
    if (!supabase || !session || !cur) return;
    setJoining(true);
    setJoinError(null);
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data } = await supabase.from("ludo_rooms").select("*").eq("id", roomId).maybeSingle();
      const fresh = data ? parseRoom(data) : null;
      if (!fresh) {
        setJoinError(t.ludo.joinFailed);
        break;
      }
      if (fresh.players.some((p) => p.user_id === session.id)) {
        void fetchAll();
        break;
      }
      if (fresh.status !== "waiting" || !isRoomFresh(fresh, Date.now())) {
        setJoinError(t.ludo.roomStale);
        break;
      }
      if (fresh.players.length >= fresh.max_players) {
        setJoinError(t.ludo.roomFull);
        break;
      }
      const me: LudoRoomPlayer = {
        user_id: session.id,
        name: session.name,
        avatar_url: session.avatar_url ?? null,
        color: COLORS[fresh.players.length],
      };
      const { data: updated, error } = await supabase
        .from("ludo_rooms")
        .update({ players: [...fresh.players, me], updated_at: new Date().toISOString() })
        .eq("id", roomId)
        .eq("updated_at", fresh.updated_at)
        .select("id");
      if (!error && updated && (updated as unknown[]).length > 0) {
        void fetchAll();
        break;
      }
      if (attempt === 1) setJoinError(t.ludo.roomFull);
    }
    setJoining(false);
  };

  /* Spectator "Join as player": the code IS the invite — it must
     match this room's code before the guarded seat-taking join runs. */
  const joinAsPlayer = async () => {
    const cur = roomRef.current;
    if (!cur) return;
    if (normalizeRoomCode(joinCode) !== cur.code) {
      setJoinError(t.ludo.wrongCode);
      return;
    }
    await joinThisRoom();
  };

  const playAgain = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase
      .from("ludo_rooms")
      .update({ state: null, status: "waiting", winner_id: null, updated_at: new Date().toISOString() })
      .eq("id", roomId)
      .eq("status", "finished");
    if (!error) void fetchAll();
    else router.push("/games/ludo/friends");
  };

  const copyCode = async () => {
    if (!room) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(room.code);
      ok = true;
    } catch {
      // Fallback for older browsers / contexts without clipboard access:
      // copy via a temporary off-screen textarea.
      try {
        const ta = document.createElement("textarea");
        ta.value = room.code;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      // Last resort: select the code text so the user can copy it manually.
      const el = codeTextRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  const sendChat = useCallback(
    async (body: string): Promise<boolean> => {
      const supabase = getSupabase();
      const cur = roomRef.current;
      const trimmed = body.trim();
      if (!supabase || !cur || !session || trimmed.length === 0 || trimmed.length > 200) return false;
      const { error } = await supabase.from("ludo_messages").insert({
        room_id: cur.id,
        user_id: session.id,
        name: session.name,
        avatar_url: session.avatar_url ?? null,
        body: trimmed,
      });
      if (error) return false;
      void fetchAll();
      return true;
    },
    [fetchAll, session],
  );

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.ludo.loading}
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.ludo.loading}
        </p>
      </div>
    );
  }

  if (status === "gone" || !room) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
        <p className="card w-full p-5 text-sm font-medium">{goneStarted ? t.ludo.notMember : t.ludo.roomGone}</p>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/ludo/friends")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.ludo.backToLobby}
        </button>
      </div>
    );
  }

  const chatNode = <RoomChat messages={messages} sessionId={session.id} onSend={sendChat} />;

  const spectatorBanner = (
    <div
      className="card flex items-start gap-3 p-4"
      style={{ background: "color-mix(in srgb, var(--gold) 8%, var(--card))" }}
    >
      <Eye size={19} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{t.ludo.spectating}</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.ludo.spectatingNote}
        </p>
      </div>
    </div>
  );

  /* Spectator view: anyone without a seat watches the live game — no
     controls, no room chat. A waiting room also offers "Join as
     player" behind the room code (the invite). */
  if (!isMember) {
    const seatFree = room.status === "waiting" && room.players.length < room.max_players && isRoomFresh(room, Date.now());
    if (room.status === "waiting" || !state) {
      return (
        <div className="mx-auto flex max-w-xl flex-col gap-4">
          {spectatorBanner}
          <div className="card p-5">
            <p className="text-sm font-medium">{t.ludo.waitingTitle}</p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em]">{room.code}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {t.ludo.seatsTaken(room.players.length, room.max_players)}
            </p>
            <div className="mt-4 grid gap-2">
              {room.players.map((p) => (
                <div
                  key={p.user_id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{ background: "var(--surface2)" }}
                >
                  <LudoAvatar url={p.avatar_url} name={p.name} size={36} ringColor={COLOR_HEX[p.color]} />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                  <span className="chip">
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_HEX[p.color] }} aria-hidden="true" />
                    {t.ludo.colors[p.color]}
                  </span>
                </div>
              ))}
            </div>
            {seatFree && (
              <div className="mt-5">
                <p className="text-sm font-medium">{t.ludo.enterCodeToJoin}</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder={t.ludo.codePh}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] uppercase outline-none"
                    style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
                  />
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={() => void joinAsPlayer()}
                    disabled={joining || joinCode.trim().length === 0}
                  >
                    {joining ? t.ludo.joining : t.ludo.joinAsPlayer}
                  </button>
                </div>
                {joinError && (
                  <p role="alert" className="mt-2 text-sm font-medium" style={{ color: "#C44D45" }}>
                    {joinError}
                  </p>
                )}
              </div>
            )}
          </div>
          <button type="button" className="btn btn-ghost self-start" onClick={() => router.push("/games/ludo/friends")}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t.ludo.backToLobby}
          </button>
        </div>
      );
    }

    /* Spectating a live or finished game: the board, the dice and the
       turn indicator render live; nothing is clickable and no chat
       renders. The turn timer still runs so timed-out turns keep
       auto-playing for the players. */
    const watchMetas: LudoPlayerMeta[] = room.players.map((p) => ({
      name: p.name,
      avatar_url: p.avatar_url,
      isBot: false,
      isYou: false,
    }));
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {spectatorBanner}
        {syncError && (
          <p role="alert" className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
            {t.ludo.syncError}
          </p>
        )}
        <LudoGame
          state={state}
          metas={watchMetas}
          canRoll={false}
          canMove={false}
          movable={[]}
          diceRolling={diceRolling}
          timerKey={state.move_no}
          timerSeconds={30}
          timerActive={state.phase !== "finished"}
          onRoll={() => {}}
          onToken={() => {}}
          onTimeout={handleTimeout}
          onPlayAgain={() => {}}
          onExit={() => router.push("/games/ludo/friends")}
          exitLabel={t.ludo.backToLobby}
          spectator
        />
        <button type="button" className="btn btn-ghost self-start" onClick={() => router.push("/games/ludo/friends")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.ludo.backToLobby}
        </button>
      </div>
    );
  }

  /* Waiting view. */
  if (room.status === "waiting" || !state) {
    const full = room.players.length === room.max_players;
    const missing = room.max_players - room.players.length;
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="card p-5 sm:p-6">
          <h1 className="font-serif-d flex items-center gap-2 text-2xl font-semibold">
            <Users size={22} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
            {t.ludo.waitingTitle}
          </h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            {t.ludo.roomCode}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span ref={codeTextRef} className="font-mono text-4xl font-bold tracking-[0.3em] select-text">
              {room.code}
            </span>
            <button type="button" className="btn btn-ghost" onClick={() => void copyCode()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? t.ludo.copied : t.ludo.copyCode}
            </button>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.ludo.shareHint}
          </p>

          <h2 className="mt-6 text-sm font-semibold">
            {t.ludo.playersInRoom} · {t.ludo.seatsTaken(room.players.length, room.max_players)}
          </h2>
          <div className="mt-2 grid gap-2">
            {room.players.map((p) => (
              <div key={p.user_id} className="flex items-center gap-3 rounded-xl px-3 py-2" style={{ background: "var(--surface2)" }}>
                <LudoAvatar url={p.avatar_url} name={p.name} size={36} ringColor={COLOR_HEX[p.color]} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                <span className="chip">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLOR_HEX[p.color] }} aria-hidden="true" />
                  {t.ludo.colors[p.color]}
                </span>
                {p.user_id === session.id && <span className="chip">{t.ludo.you}</span>}
              </div>
            ))}
          </div>

          {!full ? (
            <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
              {t.ludo.waitingMore(missing)} {t.ludo.startWhenFull}
            </p>
          ) : isHost ? (
            <button type="button" className="btn btn-gold mt-5" onClick={() => void startGame()} disabled={starting}>
              <Play size={17} aria-hidden="true" />
              {t.ludo.startNow}
            </button>
          ) : (
            <p className="mt-4 text-sm font-medium">{t.ludo.waitingForHost}</p>
          )}
          {isHost && !full && (
            <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
              {t.ludo.startWhenFull}
            </p>
          )}

          <div className="mt-6">
            <button type="button" className="btn btn-ghost" onClick={() => void leaveWaiting()} disabled={leaving}>
              <LogOut size={16} aria-hidden="true" />
              {t.ludo.leaveRoom}
            </button>
          </div>
        </div>
        {chatNode}
      </div>
    );
  }

  /* Playing / finished view. */
  const metas: LudoPlayerMeta[] = room.players.map((p) => ({
    name: p.name,
    avatar_url: p.avatar_url,
    isBot: false,
    isYou: p.user_id === session.id,
  }));
  const myTurn = mySeat === state.turn && state.phase !== "finished";
  const canRoll = myTurn && state.phase === "roll" && !diceRolling;
  const canMove = myTurn && state.phase === "move" && !diceRolling;
  const movable = canMove && state.roll !== null ? legalMoves(state, state.roll) : [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {syncError && (
        <p role="alert" className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
          {t.ludo.syncError}
        </p>
      )}
      <LudoGame
        state={state}
        metas={metas}
        canRoll={canRoll}
        canMove={canMove}
        movable={movable}
        diceRolling={diceRolling}
        timerKey={state.move_no}
        timerSeconds={30}
        timerActive={state.phase !== "finished"}
        onRoll={() => void handleRoll()}
        onToken={handleToken}
        onTimeout={handleTimeout}
        onPlayAgain={() => void playAgain()}
        onExit={() => router.push("/games/ludo/friends")}
        exitLabel={t.ludo.backToLobby}
        chat={chatNode}
        winIdentity={`${room.id}:${room.updated_at}`}
      />
      {state.phase !== "finished" && (
        <div className="card p-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.ludo.leaveGameNote}
          </p>
          <button type="button" className="btn btn-ghost mt-3" onClick={() => router.push("/games/ludo/friends")}>
            <LogOut size={16} aria-hidden="true" />
            {t.ludo.leaveRoom}
          </button>
        </div>
      )}
    </div>
  );
}
