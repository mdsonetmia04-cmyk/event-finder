"use client";

/* Chess friends room: 2 players (White = creator, Black = code
   joiner), full rules via chess.js, draw offers + resign, and a
   players-only room chat. Anyone else opening the room watches as a
   spectator: live board, turn, history and captured pieces — no move
   controls and NO chat card at all (owner's explicit order).

   State sync mirrors Draw & Guess: the get_chess_room() RPC is the
   read path, polled every 2s with a realtime UPDATE subscription as
   a live trigger; every mutation goes through a SECURITY DEFINER
   RPC. Rooms persist after leaving — seated players re-enter by
   code, and finished rooms stay openable for the final board. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  Flag,
  Handshake,
  LogOut,
  Play,
  Send,
  SwitchCamera,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { LudoAvatar } from "@/components/LudoGame";
import { ChessBoard, ChessMoveList, PieceView, type BoardMove } from "@/components/ChessBoard";
import { GAME_CHAT_PREFILL_KEY } from "@/lib/zone-chat";
import { ADOBE_STOCK_NUDGE, NUDGE_AFTER_WINS, recordWin } from "@/lib/games/win-motivation";
import { capturedPieces, chessFromFen, gameOverFromHistory, materialDiff, START_FEN } from "@/lib/chess/position";
import {
  chessSeatOf,
  isChessRoomFresh,
  parseChessMessage,
  parseChessRoom,
  type ChessMessage,
  type ChessRoom,
} from "@/lib/chess/room";
import {
  CHESS_PIECE_STYLES,
  CHESS_THEME_IDS,
  loadChessPieceStyle,
  loadChessTheme,
  saveChessPieceStyle,
  saveChessTheme,
  type ChessPieceStyle,
  type ChessThemeId,
} from "@/lib/chess/themes";
import { normalizeRoomCode } from "@/lib/ludo/room";
import {
  isSoundEnabled,
  playButtonClick,
  playChessCapture,
  playChessCheck,
  playChessMove,
  playChessWin,
  setSoundEnabled,
  unlockAudio,
} from "@/lib/ludo/sounds";

const POLL_MS = 2000;
const CHAT_LIMIT = 50;

type LoadStatus = "loading" | "ready" | "gone";

/** Per-room chat, mirroring Draw & Guess RoomChat: only players
    seated in this room can read or send (enforced by the
    chess_messages RLS policies, migration v23). Spectators never
    see this component at all. */
function RoomChat({
  messages,
  sessionId,
  onSend,
}: {
  messages: ChessMessage[];
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
      <h2 className="font-serif-d text-lg font-semibold">{t.chess.chatTitle}</h2>
      <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
        {t.chess.chatHint}
      </p>
      <div ref={scrollRef} className="mt-3 max-h-64 min-h-24 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t.chess.chatEmpty}
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
          placeholder={t.chess.chatPh}
          maxLength={200}
          className="min-w-0 flex-1 rounded-full border px-4 py-2 text-sm outline-none"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
        />
        <button type="submit" className="btn btn-gold shrink-0" disabled={sending || body.trim().length === 0}>
          <Send size={15} aria-hidden="true" />
          {t.chess.chatSend}
        </button>
      </form>
    </section>
  );
}

export default function ChessRoomPage() {
  const params = useParams();
  const rawId = params.id;
  const roomId = typeof rawId === "string" ? rawId : "";
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<ChessRoom | null>(null);
  const [messages, setMessages] = useState<ChessMessage[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [theme, setTheme] = useState<ChessThemeId>("wooden");
  const [pieceStyle, setPieceStyle] = useState<ChessPieceStyle>("realistic");
  const [soundOn, setSoundOn] = useState(true);
  const [flipped, setFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resignArmed, setResignArmed] = useState(false);
  const [acting, setActing] = useState(false);
  const [playingAgain, setPlayingAgain] = useState(false);
  /** Adobe Stock nudge: shown from the 3rd session win onward. */
  const [showNudge, setShowNudge] = useState(false);

  const roomRef = useRef<ChessRoom | null>(null);
  const fetchingRef = useRef(false);
  const codeTextRef = useRef<HTMLSpanElement>(null);
  const seenMovesRef = useRef(-1);
  const fanfareRef = useRef(false);

  useEffect(() => {
    setTheme(loadChessTheme());
    setPieceStyle(loadChessPieceStyle());
    setSoundOn(isSoundEnabled());
  }, []);

  const fetchRoom = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase.rpc("get_chess_room", { p_room_id: roomId });
      if (error) return;
      const freshRoom = data ? parseChessRoom(data) : null;
      if (!freshRoom) {
        setStatus("gone");
        return;
      }
      const prev = roomRef.current;
      if (!prev || JSON.stringify(prev) !== JSON.stringify(freshRoom)) {
        roomRef.current = freshRoom;
        setRoom(freshRoom);
      }
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

  /* Realtime trigger: a room UPDATE refetches immediately, so moves
     land live for players and spectators alike. Polling stays as the
     fallback. */
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !roomId || !session) return;
    const channel = supabase
      .channel(`chess-room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chess_rooms", filter: `id=eq.${roomId}` },
        () => void fetchRoom(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, session, fetchRoom]);

  const mySeat = room && session ? chessSeatOf(room, session.id) : -1;
  const isMember = mySeat !== -1;
  const myColor: "w" | "b" | null = mySeat === 0 ? "w" : mySeat === 1 ? "b" : null;
  const whitePlayer = room?.players.find((p) => p.seat === 0);
  const blackPlayer = room?.players.find((p) => p.seat === 1);
  const opponent = mySeat === 0 ? blackPlayer : mySeat === 1 ? whitePlayer : undefined;

  /* Room chat: players only. The effect never mounts for spectators,
     and the RLS policies would deny them anyway. */
  useEffect(() => {
    if (!ready || !session || !roomId || !isMember) return;
    const supabase = getSupabase();
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from("chess_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(CHAT_LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const parsed: ChessMessage[] = [];
          for (const row of data as unknown[]) {
            const m = parseChessMessage(row);
            if (m) parsed.push(m);
          }
          parsed.reverse();
          setMessages(parsed);
        }
      });
    const channel = supabase
      .channel(`chess-chat:${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chess_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const m = parseChessMessage(payload.new);
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
  }, [ready, session, roomId, isMember]);

  /* Move sounds + win fanfare when new moves arrive (own moves sound
     here too, right after the refetch — never double-played, because
     the submit path plays nothing itself). */
  useEffect(() => {
    if (!room) return;
    const n = room.moves.length;
    if (seenMovesRef.current === -1) {
      seenMovesRef.current = n;
      return;
    }
    if (n > seenMovesRef.current) {
      const last = room.moves[n - 1];
      if (last.san.includes("x")) playChessCapture();
      else if (last.san.includes("+") || last.san.includes("#")) playChessCheck();
      else playChessMove();
      seenMovesRef.current = n;
    } else if (n < seenMovesRef.current) {
      seenMovesRef.current = n; // rematch reset
      fanfareRef.current = false;
    }
    if (room.status === "finished" && room.winner_id === session?.id && !fanfareRef.current) {
      fanfareRef.current = true;
      playChessWin();
    }
  }, [room, session]);

  /* Session win counter for the Adobe Stock nudge: winner-only.
     Count-once identity is room + finish timestamp — updated_at
     never changes for a finished room (only Play Again rewrites
     it), so reloads never double-count. */
  const iWonRoom = room?.status === "finished" && room.winner_id !== null && room.winner_id === session?.id;
  useEffect(() => {
    if (!iWonRoom || !room) {
      setShowNudge(false);
      return;
    }
    const { count } = recordWin("chess", `chess:${room.id}:${room.updated_at}`);
    setShowNudge(count >= NUDGE_AFTER_WINS);
  }, [iWonRoom, room]);

  const chess = useMemo(() => (room ? chessFromFen(room.fen) : chessFromFen(START_FEN)), [room]);
  const turn = chess.turn();
  const isMyTurn = isMember && room?.status === "playing" && myColor !== null && turn === myColor;
  const orientation: "w" | "b" = useMemo(() => {
    const base = myColor ?? "w";
    return flipped ? (base === "w" ? "b" : "w") : base;
  }, [myColor, flipped]);
  const lastMove = useMemo(() => {
    if (!room || room.moves.length === 0) return null;
    const last = room.moves[room.moves.length - 1];
    return { from: last.from, to: last.to };
  }, [room]);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playButtonClick();
  }, [soundOn]);

  const pickTheme = (id: ChessThemeId) => {
    setTheme(id);
    saveChessTheme(id);
  };
  const pickPieces = (style: ChessPieceStyle) => {
    setPieceStyle(style);
    saveChessPieceStyle(style);
  };

  const handleMove = useCallback(
    async (move: BoardMove) => {
      const supabase = getSupabase();
      const cur = roomRef.current;
      if (!supabase || !session || !cur || !isMyTurn) return;
      const next = chessFromFen(cur.fen);
      let made;
      try {
        made = next.move({ from: move.from, to: move.to, promotion: move.promotion });
      } catch {
        return;
      }
      unlockAudio();
      /* History-aware game-over check: threefold repetition needs
         the full SAN list, not just the new FEN. */
      const over = gameOverFromHistory(
        next.fen(),
        [...cur.moves.map((m) => m.san), made.san],
      );
      const result = over?.kind ?? null;
      const winnerId =
        result === "checkmate" ? (over?.winner === "w" ? cur.white_id : cur.black_id) : null;
      const { data, error } = await supabase.rpc("make_chess_move", {
        p_room_id: cur.id,
        p_from: made.from,
        p_to: made.to,
        p_promotion: made.promotion ?? null,
        p_fen: next.fen(),
        p_san: made.san,
        p_result: result,
        p_winner_id: winnerId,
      });
      if (!error && data === true) {
        setActionError(null);
        void fetchRoom();
      } else {
        setActionError(t.chess.actionFailed);
        void fetchRoom();
      }
    },
    [session, isMyTurn, fetchRoom, t],
  );

  const resign = async () => {
    if (!resignArmed) {
      setResignArmed(true);
      window.setTimeout(() => setResignArmed(false), 3000);
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setResignArmed(false);
    setActing(true);
    const { data, error } = await supabase.rpc("resign_chess_game", { p_room_id: roomId });
    setActing(false);
    if (!error && data === true) void fetchRoom();
    else setActionError(t.chess.actionFailed);
  };

  const offerDraw = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setActing(true);
    const { data, error } = await supabase.rpc("offer_chess_draw", { p_room_id: roomId });
    setActing(false);
    if (!error && data === true) void fetchRoom();
    else setActionError(t.chess.actionFailed);
  };

  const answerDraw = async (accept: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return;
    setActing(true);
    const { data, error } = await supabase.rpc("answer_chess_draw", { p_room_id: roomId, p_accept: accept });
    setActing(false);
    if (!error && data === true) void fetchRoom();
    else setActionError(t.chess.actionFailed);
  };

  const playAgain = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setPlayingAgain(true);
    const { data, error } = await supabase.rpc("play_again_chess", { p_room_id: roomId });
    setPlayingAgain(false);
    if (!error && data === true) void fetchRoom();
    else router.push("/games/chess");
  };

  const leaveWaiting = async () => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    setLeaving(true);
    await supabase.rpc("leave_chess_room", { p_room_id: roomId });
    router.push("/games/chess");
  };

  const joinAsPlayer = async () => {
    const supabase = getSupabase();
    const cur = roomRef.current;
    if (!supabase || !session || !cur) return;
    const normalized = normalizeRoomCode(joinCode);
    if (normalized !== cur.code) {
      setJoinError(t.chess.wrongCode);
      return;
    }
    setJoining(true);
    setJoinError(null);
    const { data, error } = await supabase.rpc("join_chess_room", { p_room_id: roomId });
    setJoining(false);
    if (!error && data === true) void fetchRoom();
    else setJoinError(t.chess.joinFailed);
  };

  const sendChat = useCallback(
    async (body: string): Promise<boolean> => {
      const supabase = getSupabase();
      const trimmed = body.trim();
      if (!supabase || !session || trimmed.length === 0 || trimmed.length > 200) return false;
      const { error } = await supabase.from("chess_messages").insert({
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

  /* Share the code via Game Chat — manual, like Ludo/Draw codes: the
     share text lands in the chat composer for the player to review
     and send themselves. Nothing is ever sent automatically. */
  const sendCodeToChat = () => {
    if (!room) return;
    try {
      sessionStorage.setItem(GAME_CHAT_PREFILL_KEY, t.chess.shareMessage(room.code));
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
          {t.chess.loading}
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.chess.loading}
        </p>
      </div>
    );
  }

  if (status === "gone" || !room) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
        <p className="card w-full p-5 text-sm font-medium">{t.chess.roomGone}</p>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/chess")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.chess.backToLobby}
        </button>
      </div>
    );
  }

  const themeNames: Record<ChessThemeId, string> = {
    wooden: t.chess.themeWooden,
    classic: t.chess.themeClassic,
    modern: t.chess.themeModern,
  };
  const pieceStyleNames: Record<ChessPieceStyle, string> = {
    realistic: t.chess.pieceRealistic,
    flat: t.chess.pieceFlat,
  };

  const settingsCard = (
    <section className="card p-4">
      <p className="text-sm font-semibold">{t.chess.themeLabel}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t.chess.themeLabel}>
        {CHESS_THEME_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => pickTheme(id)}
            aria-pressed={theme === id}
            className={`btn ${theme === id ? "btn-active" : "btn-ghost"}`}
          >
            {themeNames[id]}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold">{t.chess.pieceStyleLabel}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t.chess.pieceStyleLabel}>
        {CHESS_PIECE_STYLES.map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => pickPieces(style)}
            aria-pressed={pieceStyle === style}
            className={`btn ${pieceStyle === style ? "btn-active" : "btn-ghost"}`}
          >
            {pieceStyleNames[style]}
          </button>
        ))}
      </div>
    </section>
  );

  const spectatorBanner = (
    <div
      className="card flex items-start gap-3 p-4"
      style={{ background: "color-mix(in srgb, var(--gold) 8%, var(--card))" }}
    >
      <Eye size={19} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{t.chess.spectatorBanner}</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.chess.spectatorNote}
        </p>
      </div>
    </div>
  );

  const resultText = ((): string | null => {
    if (room.status !== "finished" || !room.result) return null;
    const winnerName = room.winner_id === null ? "" : (room.players.find((p) => p.user_id === room.winner_id)?.name ?? "");
    switch (room.result) {
      case "checkmate":
        return t.chess.resultCheckmate(winnerName);
      case "stalemate":
        return t.chess.resultStalemate;
      case "insufficient":
        return t.chess.resultInsufficient;
      case "threefold":
        return t.chess.resultThreefold;
      case "fifty":
        return t.chess.resultFifty;
      case "resign":
        return t.chess.resultResign(winnerName);
      case "draw_agreement":
        return t.chess.resultDrawAgreement;
    }
  })();

  const chatNode = isMember ? (
    <RoomChat messages={messages} sessionId={session.id} onSend={sendChat} />
  ) : null;

  /* Spectator view of a waiting room: watch the lobby state, join
     with the code to take the Black seat. No chat, ever. */
  if (!isMember && room.status === "waiting") {
    const seatFree = room.players.length < 2 && isChessRoomFresh(room.updated_at, Date.now());
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        {spectatorBanner}
        <div className="card p-5">
          <p className="text-sm font-medium">{t.chess.waitingTitle}</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em]">{room.code}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.chess.seatsTaken(room.players.length, 2)}
          </p>
          <div className="mt-4 grid gap-2">
            {room.players.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: "var(--surface2)" }}
              >
                <LudoAvatar url={p.avatar_url} name={p.name} size={36} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                <span className="chip">{p.seat === 0 ? t.chess.playWhite : t.chess.playBlack}</span>
              </div>
            ))}
          </div>
          {seatFree && (
            <div className="mt-5">
              <p className="text-sm font-medium">{t.chess.enterCodeToJoin}</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t.chess.codePh}
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
                  {joining ? t.chess.joining : t.chess.joinAsPlayer}
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
        <button type="button" className="btn btn-ghost self-start" onClick={() => router.push("/games/chess")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.chess.backToLobby}
        </button>
      </div>
    );
  }

  /* Member waiting view. */
  if (isMember && room.status === "waiting") {
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
            {t.chess.waitingTitle}
          </h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            {t.chess.roomCode}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span ref={codeTextRef} className="font-mono text-4xl font-bold tracking-[0.3em] select-text">
              {room.code}
            </span>
            <button type="button" className="btn btn-ghost" onClick={() => void copyCode()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? t.chess.copied : t.chess.copyCode}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => sendCodeToChat()}>
              <Send size={16} aria-hidden="true" />
              {t.chess.sendToChat}
            </button>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.chess.shareHint}
          </p>

          <h2 className="mt-6 text-sm font-semibold">
            {t.chess.playersInRoom} · {t.chess.seatsTaken(room.players.length, 2)}
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
                <span className="chip">{p.seat === 0 ? t.chess.playWhite : t.chess.playBlack}</span>
                {p.user_id === session.id && <span className="chip">{t.ludo.you}</span>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            {t.chess.waitingForOpponent}
          </p>
          <div className="mt-6">
            <button type="button" className="btn btn-ghost" onClick={() => void leaveWaiting()} disabled={leaving}>
              <LogOut size={16} aria-hidden="true" />
              {t.chess.leaveRoom}
            </button>
          </div>
        </div>
        {chatNode}
      </div>
    );
  }

  /* Finished view: final board + result for everyone; members get
     Play Again (colours swap). No chat, mirroring Draw & Guess. */
  if (room.status === "finished") {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        {!isMember && spectatorBanner}
        <div className="card p-5 text-center sm:p-6">
          <h1 className="font-serif-d flex items-center justify-center gap-2 text-2xl font-semibold">
            <Trophy size={22} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
            {resultText ?? t.chess.drawLabel}
          </h1>
          {iWonRoom && showNudge && (
            <p
              className="mx-auto mt-3 max-w-md rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--surface2)", color: "var(--gold-deep)" }}
            >
              {ADOBE_STOCK_NUDGE}
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {isMember && (
              <button type="button" className="btn btn-gold" onClick={() => void playAgain()} disabled={playingAgain}>
                <Play size={17} aria-hidden="true" />
                {t.chess.playAgain}
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/chess")}>
              <ArrowLeft size={16} aria-hidden="true" />
              {t.chess.backToLobby}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="mx-auto w-full max-w-[560px] flex-1">
            <ChessBoard
              fen={room.fen}
              orientation={orientation}
              theme={theme}
              pieceStyle={pieceStyle}
              interactive={false}
              lastMove={lastMove}
              boardLabel={t.chess.boardLabel}
              promotionTitle={t.chess.selectPromotion}
              pieceNames={t.chess.pieceNames}
            />
            <div className="mt-3 flex justify-center">
              <button type="button" className="btn btn-ghost" onClick={() => setFlipped((f) => !f)}>
                <SwitchCamera size={16} aria-hidden="true" />
                {t.chess.flipBoard}
              </button>
            </div>
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
            <section className="card p-4">
              <h2 className="text-sm font-semibold">{t.chess.moveHistory}</h2>
              <div className="mt-2">
                <ChessMoveList sans={room.moves.map((m) => m.san)} emptyLabel={t.chess.movesEmpty} />
              </div>
            </section>
            {settingsCard}
          </div>
        </div>
      </div>
    );
  }

  /* Playing view. */
  const captured = capturedPieces(room.fen);
  const diff = materialDiff(room.fen);
  const inCheck = chess.isCheck();
  const statusText = inCheck
    ? t.chess.check
    : isMyTurn
      ? t.chess.yourTurn
      : isMember && opponent
        ? t.chess.opponentTurn(opponent.name)
        : turn === "w"
          ? t.chess.whiteToMove
          : t.chess.blackToMove;
  const offerPending = room.draw_offer_by !== null;
  const offerIsMine = room.draw_offer_by === session.id;
  const offerFrom = offerPending && !offerIsMine ? room.players.find((p) => p.user_id === room.draw_offer_by) : undefined;

  const playerRow = (
    player: { user_id: string; name: string; avatar_url: string | null } | undefined,
    color: "w" | "b",
    capturedBy: Array<"p" | "n" | "b" | "r" | "q" | "k">,
  ) => {
    const active = turn === color;
    return (
      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2"
        style={{
          background: "var(--surface2)",
          boxShadow: active ? "0 0 0 2px var(--gold-deep)" : undefined,
        }}
      >
        <LudoAvatar url={player?.avatar_url ?? null} name={player?.name ?? "?"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {player?.name ?? "…"}
            {player?.user_id === session.id && ` · ${t.ludo.you}`}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {color === "w" ? t.chess.playWhite : t.chess.playBlack}
            {diff !== 0 &&
              ((color === "w" && diff > 0) || (color === "b" && diff < 0)) &&
              ` · ${t.chess.materialAhead(Math.abs(diff))}`}
          </p>
        </div>
        <span className="flex shrink-0 flex-wrap justify-end gap-0.5">
          {capturedBy.slice(0, 8).map((p, i) => (
            <span key={`${p}-${i}`} className="inline-block h-5 w-5">
              <PieceView type={p} color={color === "w" ? "b" : "w"} style={pieceStyle} size="100%" />
            </span>
          ))}
        </span>
      </div>
    );
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      {!isMember && spectatorBanner}
      {actionError && (
        <p role="alert" className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
          {actionError}
        </p>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="mx-auto w-full max-w-[560px] flex-1">
          <ChessBoard
            fen={room.fen}
            orientation={orientation}
            theme={theme}
            pieceStyle={pieceStyle}
            interactive={isMyTurn}
            lastMove={lastMove}
            onMove={(move) => void handleMove(move)}
            boardLabel={t.chess.boardLabel}
            promotionTitle={t.chess.selectPromotion}
            pieceNames={t.chess.pieceNames}
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setFlipped((f) => !f)}>
              <SwitchCamera size={16} aria-hidden="true" />
              {t.chess.flipBoard}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={toggleSound}
              aria-label={soundOn ? t.ludo.soundOff : t.ludo.soundOn}
              aria-pressed={soundOn}
            >
              {soundOn ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
              {soundOn ? t.ludo.soundOn : t.ludo.soundOff}
            </button>
            {isMember && (
              <>
                <button type="button" className="btn btn-ghost" onClick={() => void resign()} disabled={acting}>
                  <Flag size={16} aria-hidden="true" />
                  {resignArmed ? t.chess.resignAgain : t.chess.resign}
                </button>
                {!offerPending && (
                  <button type="button" className="btn btn-ghost" onClick={() => void offerDraw()} disabled={acting}>
                    <Handshake size={16} aria-hidden="true" />
                    {t.chess.offerDraw}
                  </button>
                )}
              </>
            )}
          </div>
          {isMember && offerPending && offerIsMine && (
            <p className="mt-2 text-center text-sm" style={{ color: "var(--muted)" }}>
              {t.chess.drawOfferSent}
            </p>
          )}
          {isMember && offerPending && !offerIsMine && offerFrom && (
            <div className="card mt-3 p-4 text-center">
              <p className="text-sm font-semibold">{t.chess.drawOfferFrom(offerFrom.name)}</p>
              <div className="mt-3 flex justify-center gap-2">
                <button type="button" className="btn btn-gold" onClick={() => void answerDraw(true)} disabled={acting}>
                  {t.chess.acceptDraw}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => void answerDraw(false)} disabled={acting}>
                  {t.chess.declineDraw}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
          <section className="card flex flex-col gap-2 p-4">
            <p className="text-sm font-bold" style={{ color: "var(--gold-deep)" }}>
              {statusText}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {isMember
                ? myColor === "w"
                  ? t.chess.youAreWhite
                  : t.chess.youAreBlack
                : turn === "w"
                  ? t.chess.whiteToMove
                  : t.chess.blackToMove}
            </p>
            {playerRow(whitePlayer, "w", captured.byWhite)}
            {playerRow(blackPlayer, "b", captured.byBlack)}
          </section>
          <section className="card p-4">
            <h2 className="text-sm font-semibold">{t.chess.moveHistory}</h2>
            <div className="mt-2">
              <ChessMoveList sans={room.moves.map((m) => m.san)} emptyLabel={t.chess.movesEmpty} />
            </div>
          </section>
          {settingsCard}
          {chatNode}
          <button type="button" className="btn btn-ghost self-start" onClick={() => router.push("/games/chess")}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t.chess.backToLobby}
          </button>
        </div>
      </div>
    </div>
  );
}
