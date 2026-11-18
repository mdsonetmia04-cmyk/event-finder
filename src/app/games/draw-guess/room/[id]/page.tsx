"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, Copy, LogOut, PencilLine, Play, Send, Trophy, Users } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { LudoAvatar } from "@/components/LudoGame";
import { DrawCanvas, type DrawBroadcastEvent, type DrawCanvasHandle } from "@/components/DrawCanvas";
import { chooseWords } from "@/lib/draw-guess/words";
import { GAME_CHAT_PREFILL_KEY } from "@/lib/zone-chat";
import { ADOBE_STOCK_NUDGE, NUDGE_AFTER_WINS, recordWin } from "@/lib/games/win-motivation";
import {
  DRAW_PICK_SECONDS,
  DRAW_REVEAL_SECONDS,
  DRAW_ROUND_SECONDS,
  drawerOf,
  drawSeatIndex,
  isDrawRoomFresh,
  parseDrawMessage,
  parseDrawRoom,
  type DrawMessage,
  type DrawRoom,
} from "@/lib/draw-guess/room";

const POLL_MS = 2000;
const CHAT_LIMIT = 50;
const AUTO_PICK_SECONDS = 5;

type LoadStatus = "loading" | "ready" | "gone";

/** Light validation for broadcast payloads: never trust the channel. */
function parseBroadcastEvent(value: unknown): DrawBroadcastEvent | null {
  if (typeof value !== "object" || value === null) return null;
  const ev = value as Record<string, unknown>;
  if (ev.type === "clear") return { type: "clear" };
  if (ev.type !== "stroke") return null;
  const stroke = ev.stroke as Record<string, unknown> | undefined;
  if (!stroke || typeof stroke.id !== "string" || typeof stroke.color !== "string") return null;
  if (typeof stroke.size !== "number" || typeof stroke.eraser !== "boolean") return null;
  if (!Array.isArray(ev.points)) return null;
  const points: { x: number; y: number }[] = [];
  for (const p of ev.points as unknown[]) {
    if (typeof p !== "object" || p === null) return null;
    const pt = p as Record<string, unknown>;
    if (typeof pt.x !== "number" || typeof pt.y !== "number") return null;
    points.push({ x: pt.x, y: pt.y });
  }
  return {
    type: "stroke",
    stroke: { id: stroke.id, color: stroke.color, size: stroke.size, eraser: stroke.eraser },
    points,
    done: ev.done === true,
  };
}

/** Per-room chat, mirroring Ludo's RoomChat: only players seated in
    this room can read or send (enforced by the draw_messages RLS
    policies, migration v21). Core chat only — messages + composer. */
function RoomChat({
  messages,
  sessionId,
  onSend,
}: {
  messages: DrawMessage[];
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
      <h2 className="font-serif-d text-lg font-semibold">{t.draw.chatTitle}</h2>
      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
        {t.draw.chatHint}
      </p>
      <div ref={scrollRef} className="mt-3 max-h-64 min-h-24 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t.draw.chatEmpty}
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
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(body);
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.draw.chatPh}
          maxLength={200}
          className="min-w-0 flex-1 rounded-full border px-4 py-2 text-sm outline-none"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
        />
        <button type="submit" className="btn btn-gold shrink-0" disabled={sending || body.trim().length === 0}>
          <Send size={15} aria-hidden="true" />
          {t.draw.chatSend}
        </button>
      </form>
    </section>
  );
}

export default function DrawRoomPage() {
  const params = useParams();
  const rawId = params.id;
  const roomId = typeof rawId === "string" ? rawId : "";
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<DrawRoom | null>(null);
  const [messages, setMessages] = useState<DrawMessage[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [goneStarted, setGoneStarted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [choices, setChoices] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const [guess, setGuess] = useState("");
  const [guessing, setGuessing] = useState(false);
  const [guessMiss, setGuessMiss] = useState(false);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [playingAgain, setPlayingAgain] = useState(false);
  /** Adobe Stock nudge: shown from the 3rd session win onward. */
  const [showNudge, setShowNudge] = useState(false);

  const roomRef = useRef<DrawRoom | null>(null);
  const fetchingRef = useRef(false);
  const wasWaitingRef = useRef(false);
  const codeTextRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<DrawCanvasHandle>(null);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabase>>["channel"]> | null>(null);
  const subscribedRef = useRef(false);
  const advancedRef = useRef<Set<string>>(new Set());
  const choicesForRef = useRef(-1);
  const pickingRef = useRef(false);
  const clearKeyRef = useRef("");

  /* Room state polling (2s, Ludo pattern) through the RPC-gated read —
     direct SELECT on draw_rooms is denied so the word never leaks. */
  const fetchRoom = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase.rpc("get_draw_room", { p_room_id: roomId });
      if (error) return;
      const freshRoom = data ? parseDrawRoom(data) : null;
      if (!freshRoom) {
        setGoneStarted(wasWaitingRef.current);
        setStatus("gone");
        return;
      }
      const prev = roomRef.current;
      if (!prev || JSON.stringify(prev) !== JSON.stringify(freshRoom)) {
        roomRef.current = freshRoom;
        setRoom(freshRoom);
      }
      if (freshRoom.status === "waiting") wasWaitingRef.current = true;
      setStatus("ready");
    } finally {
      fetchingRef.current = false;
    }
  }, [roomId]);

  useEffect(() => {
    if (status === "gone") return;
    void fetchRoom();
    const id = setInterval(() => {
      if (!document.hidden) void fetchRoom();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchRoom, status]);

  /* Local clock for countdowns. */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const mySeat = room && session ? drawSeatIndex(room, session.id) : -1;
  const isHost = room?.host_id === session?.id;
  const isMember = mySeat !== -1;
  const amDrawer = room?.current_drawer_id === session?.id;
  const drawer = room ? drawerOf(room) : undefined;
  const me = room && session ? room.players.find((p) => p.user_id === session.id) : undefined;

  /* Session win counter for the Adobe Stock nudge: counts only when
     the viewing player ranked #1. Count-once identity is room + the
     finish timestamp — updated_at never changes for a finished room
     (joins/leaves only touch waiting rooms; only Play Again rewrites
     it), so reloads showing the same scoreboard never double-count,
     and a replayed game is a new identity. */
  const drawWinnerId =
    room?.status === "finished"
      ? [...room.players].sort((a, b) => b.score - a.score || a.seat - b.seat)[0]?.user_id ?? null
      : null;
  const iWonDraw = drawWinnerId !== null && session !== null && drawWinnerId === session.id;
  useEffect(() => {
    if (!iWonDraw || !room) {
      setShowNudge(false);
      return;
    }
    const { count } = recordWin("draw-guess", `draw-guess:${room.id}:${room.updated_at}`);
    setShowNudge(count >= NUDGE_AFTER_WINS);
  }, [iWonDraw, room]);

  /* Stroke broadcast channel: guessers render what the drawer sends. */
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !roomId || !session) return;
    const channel = supabase.channel(`draw:${roomId}`, { config: { broadcast: { self: false } } });
    channelRef.current = channel;
    channel
      .on("broadcast", { event: "draw" }, ({ payload }) => {
        const ev = parseBroadcastEvent(payload);
        if (ev) canvasRef.current?.applyRemote(ev);
      })
      .subscribe((state) => {
        subscribedRef.current = state === "SUBSCRIBED";
      });
    return () => {
      subscribedRef.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomId, session]);

  const sendDrawEvent = useCallback((ev: DrawBroadcastEvent) => {
    const channel = channelRef.current;
    if (!channel || !subscribedRef.current) return;
    void channel.send({ type: "broadcast", event: "draw", payload: ev });
  }, []);

  /* Room chat: load the last 50 messages, then stay live on INSERTs
     (GameChat pattern; the subscription is filtered to this room). */
  useEffect(() => {
    if (!ready || !session || !roomId) return;
    const supabase = getSupabase();
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("draw_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(CHAT_LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const parsed: DrawMessage[] = [];
          for (const row of data as unknown[]) {
            const m = parseDrawMessage(row);
            if (m) parsed.push(m);
          }
          parsed.reverse();
          setMessages(parsed);
        }
      });
    const channel = supabase
      .channel(`draw-chat:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "draw_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const m = parseDrawMessage(payload.new);
          if (!m) return;
          // Dedupe by id: realtime can replay an event on reconnect.
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev.slice(-(CHAT_LIMIT - 1)), m],
          );
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ready, session, roomId]);

  /* Wipe the canvas when a new round starts (or the game resets). The
     drawing stays visible through the reveal phase of the same round. */
  const clearKey = room
    ? `${room.status}:${room.round_no}:${room.phase === "picking" ? "picking" : "draw"}`
    : "";
  useEffect(() => {
    if (!clearKey) return;
    if (clearKeyRef.current !== "" && clearKeyRef.current !== clearKey) {
      canvasRef.current?.clearAll();
    }
    clearKeyRef.current = clearKey;
  }, [clearKey]);

  /* Advance the game when a phase deadline passes. Any member's client
     may call it; the RPC's state checks make racing calls harmless. */
  useEffect(() => {
    if (!room || !session || !isMember) return;
    if (room.status !== "playing" || !room.round_ends_at) return;
    if (Date.now() < new Date(room.round_ends_at).getTime()) return;
    const key = `${room.round_no}:${room.phase}:${room.round_ends_at}`;
    if (advancedRef.current.has(key)) return;
    advancedRef.current.add(key);
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.rpc("advance_draw_round", { p_room_id: roomId }).then(() => void fetchRoom());
  }, [room, session, isMember, roomId, fetchRoom]);

  /* The drawer gets 3 fresh word choices per round (never repeats —
     used_words comes back from the RPC for the drawer only). */
  useEffect(() => {
    if (room?.phase !== "picking" || !amDrawer) return;
    if (choicesForRef.current === room.round_no) return;
    choicesForRef.current = room.round_no;
    setChoices(chooseWords(room.used_words, 3));
  }, [room, amDrawer]);

  const pickWord = useCallback(
    async (word: string, silent: boolean) => {
      const supabase = getSupabase();
      if (!supabase || !session || pickingRef.current) return;
      pickingRef.current = true;
      setPicking(true);
      const { data, error } = await supabase.rpc("start_draw_round", { p_room_id: roomId, p_word: word });
      pickingRef.current = false;
      setPicking(false);
      if (!error && data === true) {
        setChoices([]);
        void fetchRoom();
      } else if (!silent) {
        setActionError(t.draw.actionFailed);
      }
    },
    [roomId, session, fetchRoom, t],
  );

  /* Auto-pick a random choice when the pick clock nearly runs out, so
     an idle drawer doesn't stall the round for everyone. */
  useEffect(() => {
    if (room?.phase !== "picking" || !amDrawer || choices.length === 0 || !room.round_ends_at) return;
    const remaining = (new Date(room.round_ends_at).getTime() - now) / 1000;
    if (remaining > AUTO_PICK_SECONDS) return;
    void pickWord(choices[Math.floor(Math.random() * choices.length)], true);
  }, [room, amDrawer, choices, now, pickWord]);

  const startGame = async () => {
    const supabase = getSupabase();
    if (!supabase || !session || !isHost) return;
    setStarting(true);
    setActionError(null);
    const { data, error } = await supabase.rpc("start_draw_game", { p_room_id: roomId });
    setStarting(false);
    if (!error && data === true) void fetchRoom();
    else setActionError(t.draw.actionFailed);
  };

  const leaveWaiting = async () => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    setLeaving(true);
    await supabase.rpc("leave_draw_room", { p_room_id: roomId });
    router.push("/games/draw-guess");
  };

  const joinThisRoom = async () => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    setJoining(true);
    setJoinError(null);
    const { data, error } = await supabase.rpc("join_draw_room", { p_room_id: roomId });
    setJoining(false);
    if (!error && data === true) void fetchRoom();
    else setJoinError(t.draw.joinFailed);
  };

  const playAgain = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setPlayingAgain(true);
    const { data, error } = await supabase.rpc("play_again_draw", { p_room_id: roomId });
    setPlayingAgain(false);
    if (!error && data === true) void fetchRoom();
    else router.push("/games/draw-guess");
  };

  const submitGuess = async () => {
    const supabase = getSupabase();
    const trimmed = guess.trim();
    if (!supabase || !session || !trimmed || guessing) return;
    setGuessing(true);
    setGuessMiss(false);
    const { data, error } = await supabase.rpc("check_draw_guess", { p_room_id: roomId, p_guess: trimmed });
    setGuessing(false);
    if (!error && data === true) {
      setGuess("");
      void fetchRoom();
    } else {
      setGuess("");
      setGuessMiss(true);
      window.setTimeout(() => setGuessMiss(false), 2500);
    }
  };

  /* Room chat send, mirroring Ludo's sendChat: the name/avatar are
     snapshotted from the session; the realtime INSERT subscription
     delivers the new message to every open client in this room. */
  const sendChat = useCallback(
    async (body: string): Promise<boolean> => {
      const supabase = getSupabase();
      const trimmed = body.trim();
      if (!supabase || !session || trimmed.length === 0 || trimmed.length > 200) return false;
      const { error } = await supabase.from("draw_messages").insert({
        room_id: roomId,
        user_id: session.id,
        name: session.name,
        avatar_url: session.avatar_url ?? null,
        body: trimmed,
      });
      return !error;
    },
    [roomId, session],
  );

  /* Share the code via Game Chat — manual, like Ludo codes: the
     share text lands in the chat composer for the player to review
     and send themselves. Nothing is ever sent automatically. */
  const sendCodeToChat = () => {
    if (!room) return;
    try {
      sessionStorage.setItem(GAME_CHAT_PREFILL_KEY, t.draw.shareMessage(room.code));
    } catch {
      // Storage unavailable (private mode): still navigate; the player
      // can type the code by hand.
    }
    router.push("/games");
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

  if (!ready || !session) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.draw.loading}
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.draw.loading}
        </p>
      </div>
    );
  }

  if (status === "gone" || !room) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
        <p className="card w-full p-5 text-sm font-medium">{goneStarted ? t.draw.notMember : t.draw.roomGone}</p>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/draw-guess")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.draw.backToLobby}
        </button>
      </div>
    );
  }

  const chatNode = <RoomChat messages={messages} sessionId={session.id} onSend={sendChat} />;

  /* Non-member view of a room: offer to join a waiting room. */
  if (!isMember) {
    const seatFree =
      room.status === "waiting" && room.players.length < room.max_players && isDrawRoomFresh(room.updated_at, Date.now());
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="card p-5">
          <p className="text-sm font-medium">{seatFree ? t.draw.waitingTitle : t.draw.notMember}</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em]">{room.code}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.draw.seatsTaken(room.players.length, room.max_players)}
          </p>
          {joinError && (
            <p role="alert" className="mt-2 text-sm font-medium" style={{ color: "#C44D45" }}>
              {joinError}
            </p>
          )}
          {seatFree && (
            <button type="button" className="btn btn-gold mt-4" onClick={() => void joinThisRoom()} disabled={joining}>
              {joining ? t.draw.joining : t.draw.joinRoom}
            </button>
          )}
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/draw-guess")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.draw.backToLobby}
        </button>
      </div>
    );
  }

  /* Waiting view. */
  if (room.status === "waiting") {
    const canStart = room.players.length >= 2;
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {actionError && (
          <p role="alert" className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
            {actionError}
          </p>
        )}
        <div className="card p-5 sm:p-6">
          <h1 className="font-serif-d flex items-center gap-2 text-2xl font-semibold">
            <Users size={22} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
            {t.draw.waitingTitle}
          </h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            {t.draw.roomCode}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span ref={codeTextRef} className="font-mono text-4xl font-bold tracking-[0.3em] select-text">
              {room.code}
            </span>
            <button type="button" className="btn btn-ghost" onClick={() => void copyCode()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? t.draw.copied : t.draw.copyCode}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => sendCodeToChat()}>
              <Send size={16} aria-hidden="true" />
              {t.draw.sendToChat}
            </button>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.draw.shareHint}
          </p>

          <h2 className="mt-6 text-sm font-semibold">
            {t.draw.playersInRoom} · {t.draw.seatsTaken(room.players.length, room.max_players)}
          </h2>
          <div className="mt-2 grid gap-2">
            {room.players.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: "var(--surface2)" }}
              >
                <LudoAvatar url={p.avatar_url} name={p.name} size={36} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                {p.user_id === room.host_id && <span className="chip">{t.draw.hostLabel}</span>}
                {p.user_id === session.id && <span className="chip">{t.ludo.you}</span>}
              </div>
            ))}
          </div>

          {canStart ? (
            isHost ? (
              <button type="button" className="btn btn-gold mt-5" onClick={() => void startGame()} disabled={starting}>
                <Play size={17} aria-hidden="true" />
                {t.draw.startNow}
              </button>
            ) : (
              <p className="mt-4 text-sm font-medium">{t.draw.waitingForHost}</p>
            )
          ) : (
            <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
              {t.draw.needMore} {t.draw.startWhenReady}
            </p>
          )}
          {isHost && canStart && (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {t.draw.roundsNote(room.players.length)}
            </p>
          )}

          <div className="mt-6">
            <button type="button" className="btn btn-ghost" onClick={() => void leaveWaiting()} disabled={leaving}>
              <LogOut size={16} aria-hidden="true" />
              {t.draw.leaveRoom}
            </button>
          </div>
        </div>
        {chatNode}
      </div>
    );
  }

  /* Finished view: final scoreboard. */
  if (room.status === "finished") {
    const ranked = [...room.players].sort((a, b) => b.score - a.score || a.seat - b.seat);
    const winner = ranked[0];
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="card p-5 sm:p-6">
          <h1 className="font-serif-d flex items-center gap-2 text-2xl font-semibold">
            <Trophy size={22} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
            {t.draw.finalTitle}
          </h1>
          {winner && (
            <p className="mt-2 text-sm font-medium">
              {winner.user_id === session.id ? t.draw.youWon : t.draw.winnerWon(winner.name)}
            </p>
          )}
          {winner && winner.user_id === session.id && showNudge && (
            <p
              className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--surface2)", color: "var(--gold-deep)" }}
            >
              {ADOBE_STOCK_NUDGE}
            </p>
          )}
          <div className="mt-4 grid gap-2">
            {ranked.map((p, i) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: "var(--surface2)" }}
              >
                <span className="font-serif-d w-6 text-center text-lg font-bold">{i + 1}</span>
                <LudoAvatar url={p.avatar_url} name={p.name} size={36} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                {p.user_id === session.id && <span className="chip">{t.ludo.you}</span>}
                <span className="text-sm font-bold" style={{ color: "var(--gold-deep)" }}>
                  {t.draw.points(p.score)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn btn-gold" onClick={() => void playAgain()} disabled={playingAgain}>
              <Play size={17} aria-hidden="true" />
              {t.draw.playAgain}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/draw-guess")}>
              <LogOut size={16} aria-hidden="true" />
              {t.draw.leaveRoom}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Playing view. */
  const endsAt = room.round_ends_at ? new Date(room.round_ends_at).getTime() : null;
  const remainingMs = endsAt !== null ? Math.max(0, endsAt - now) : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const phaseTotal =
    room.phase === "picking" ? DRAW_PICK_SECONDS : room.phase === "reveal" ? DRAW_REVEAL_SECONDS : DRAW_ROUND_SECONDS;
  const barPct = endsAt !== null ? Math.min(100, Math.max(0, (remainingMs / (phaseTotal * 1000)) * 100)) : 0;
  const canDraw = amDrawer && room.phase === "drawing";
  const iGuessed = me?.has_guessed === true;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {actionError && (
        <p role="alert" className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
          {actionError}
        </p>
      )}

      {/* Board + chat: beside the board on desktop, below it on mobile (Ludo layout). */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
                <PencilLine size={20} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
                {t.draw.roundOf(room.round_no, room.max_rounds)}
              </h1>
              <p className="flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--gold-deep)" }}>
                <Clock size={16} aria-hidden="true" />
                {remainingSec}s
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: "var(--surface2)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${barPct}%`, background: "linear-gradient(90deg, var(--gold-2), var(--gold))" }}
              />
            </div>

            {/* Phase panel: word, choices, hint, or reveal. */}
            <div className="mt-4">
              {room.phase === "picking" &&
                (amDrawer ? (
                  <div>
                    <p className="text-sm font-semibold">{t.draw.yourTurnDraw}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                      {t.draw.chooseWord}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {choices.map((word) => (
                        <button
                          key={word}
                          type="button"
                          className="btn btn-gold"
                          disabled={picking}
                          onClick={() => void pickWord(word, false)}
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                      {t.draw.pickTimeNote}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm font-medium">
                    {drawer ? t.draw.drawerPicking(drawer.name) : t.draw.loading}
                  </p>
                ))}

              {room.phase === "drawing" &&
                (amDrawer ? (
                  <div>
                    <p className="text-sm font-semibold">{t.draw.youAreDrawing}</p>
                    <p className="font-serif-d mt-1 text-3xl font-bold tracking-wide" style={{ color: "var(--gold-deep)" }}>
                      {room.current_word ? t.draw.drawWord(room.current_word) : t.draw.loading}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                      {t.draw.drawerHint}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold">
                      {drawer ? t.draw.drawingNow(drawer.name) : t.draw.loading}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-[0.35em] select-none" aria-label={t.draw.guessing}>
                      {room.word_hint ?? ""}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                      {t.draw.guessing}
                    </p>
                  </div>
                ))}

              {room.phase === "reveal" && (
                <div>
                  <p className="font-serif-d text-2xl font-bold" style={{ color: "var(--gold-deep)" }}>
                    {room.current_word ? t.draw.revealWord(room.current_word) : ""}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                    {t.draw.nextRoundSoon}
                  </p>
                </div>
              )}
            </div>

            {/* Scoreboard strip. */}
            <div className="mt-4 flex flex-wrap gap-2">
              {room.players.map((p) => (
                <div
                  key={p.user_id}
                  className="flex items-center gap-2 rounded-full border px-2.5 py-1"
                  style={{ borderColor: "var(--line)", background: "var(--surface)" }}
                >
                  <LudoAvatar url={p.avatar_url} name={p.name} size={24} />
                  <span className="max-w-24 truncate text-xs font-semibold">{p.name}</span>
                  <span className="text-xs font-bold" style={{ color: "var(--gold-deep)" }}>
                    {t.draw.points(p.score)}
                  </span>
                  {p.user_id === room.current_drawer_id && (
                    <span className="text-[11px] font-semibold" style={{ color: "var(--gold-deep)" }}>
                      ✏️ {t.draw.drawerLabel}
                    </span>
                  )}
                  {p.user_id !== room.current_drawer_id && p.has_guessed && room.phase !== "picking" && (
                    <Check size={13} style={{ color: "#2FA36B" }} aria-label={t.draw.guessedIt} />
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4">
            <DrawCanvas ref={canvasRef} editable={canDraw} onLocalEvent={sendDrawEvent} />

            {/* Guess box: guessers only, while drawing, until they guess it. */}
            {room.phase === "drawing" && !amDrawer && (
              <div className="mt-4">
                {iGuessed ? (
                  <p className="rounded-xl px-3 py-2 text-center text-sm font-semibold" style={{ background: "var(--surface2)" }}>
                    ✅ {t.draw.guessedIt}
                  </p>
                ) : (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submitGuess();
                    }}
                  >
                    <input
                      value={guess}
                      onChange={(e) => setGuess(e.target.value)}
                      placeholder={t.draw.guessPh}
                      maxLength={40}
                      autoComplete="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
                      style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
                    />
                    <button type="submit" className="btn btn-gold shrink-0" disabled={guessing || guess.trim().length === 0}>
                      <Send size={15} aria-hidden="true" />
                      {t.draw.guessButton}
                    </button>
                  </form>
                )}
                {guessMiss && (
                  <p role="alert" className="mt-2 text-center text-sm font-medium" style={{ color: "#C44D45" }}>
                    {t.draw.guessMiss}
                  </p>
                )}
              </div>
            )}
          </section>
        </div>
        <div className="w-full lg:w-[340px] lg:shrink-0">{chatNode}</div>
      </div>

      <div className="card p-4">
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.draw.leaveGameNote}
        </p>
        <button type="button" className="btn btn-ghost mt-3" onClick={() => router.push("/games/draw-guess")}>
          <LogOut size={16} aria-hidden="true" />
          {t.draw.leaveRoom}
        </button>
      </div>
    </div>
  );
}
