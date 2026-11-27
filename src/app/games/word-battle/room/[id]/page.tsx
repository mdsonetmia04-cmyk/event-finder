"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Eye,
  Lightbulb,
  LogOut,
  Play,
  RotateCcw,
  Send,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { LudoAvatar } from "@/components/LudoGame";
import { GAME_CHAT_PREFILL_KEY } from "@/lib/zone-chat";
import { ADOBE_STOCK_NUDGE, NUDGE_AFTER_WINS, pickPostMatchLine, recordWin } from "@/lib/games/win-motivation";
import { correctWordDisplayIndex, wordOptions } from "@/lib/words/bank";
import {
  WORD_MATCH_QUESTIONS,
  WORD_QUESTION_MS,
  WORD_REVEAL_MS,
  drawWordMatchQuestions,
  isWordRoomFresh,
  parseWordRoom,
  wordSeatIndex,
  rankWordPlayers,
  resolveWordMatchQuestion,
  type WordRoom,
} from "@/lib/words/multiplayer";

const POLL_MS = 2000;

type LoadStatus = "loading" | "ready" | "gone";

const OPTION_LETTERS = ["A", "B", "C", "D"];
const GREEN = "#2FA36B";
const RED = "#E5484D";

export default function WordRoomPage() {
  const params = useParams();
  const rawId = params.id;
  const roomId = typeof rawId === "string" ? rawId : "";
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<WordRoom | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [goneStarted, setGoneStarted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [playingAgain, setPlayingAgain] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** My pick for the current question (display index), set on submit. */
  const [myPick, setMyPick] = useState<number | null>(null);
  /** Adobe Stock nudge: shown from the 3rd session win onward. */
  const [showNudge, setShowNudge] = useState(false);

  const roomRef = useRef<WordRoom | null>(null);
  const fetchingRef = useRef(false);
  const wasWaitingRef = useRef(false);
  const codeTextRef = useRef<HTMLSpanElement>(null);
  const advancedRef = useRef<Set<string>>(new Set());

  /* Room state polling (2s, Ludo/Draw & Guess pattern) through the
     RPC-gated read — direct SELECT on word_rooms is denied so the
     correct answers never leak. */
  const fetchRoom = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const { data, error } = await supabase.rpc("get_word_room", { p_room_id: roomId });
      if (error) return;
      const freshRoom = data ? parseWordRoom(data) : null;
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

  const mySeat = room && session ? wordSeatIndex(room, session.id) : -1;
  const isHost = room?.host_id === session?.id;
  const isMember = mySeat !== -1;
  const me = room && session ? room.players.find((p) => p.user_id === session.id) : undefined;
  const iLeft = me?.has_left === true;

  /* A new question (or the reveal) clears my local pick. */
  useEffect(() => {
    setMyPick(null);
  }, [room?.current_q, room?.phase]);

  /* Advance the match when a phase deadline passes. Any seated
     member's client may call it; the RPC's state checks make racing
     calls harmless. */
  useEffect(() => {
    if (!room || !session || !isMember || iLeft) return;
    if (room.status !== "playing" || !room.question_ends_at) return;
    if (Date.now() < new Date(room.question_ends_at).getTime()) return;
    const key = `${room.current_q}:${room.phase}:${room.question_ends_at}`;
    if (advancedRef.current.has(key)) return;
    advancedRef.current.add(key);
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase.rpc("advance_word_round", { p_room_id: roomId }).then(() => void fetchRoom());
  }, [room, session, isMember, iLeft, roomId, fetchRoom]);

  /* Session win counter for the Adobe Stock nudge: counts only when
     the viewing player ranked #1 (a marks+time tie counts as a win,
     like a draw). Count-once identity is room + the finish timestamp
     — updated_at never changes for a finished room (only Play Again
     rewrites it), so reloads showing the same scoreboard never
     double-count, and a replayed game is a new identity. */
  const ranked = room?.status === "finished" ? rankWordPlayers(room.players) : [];
  const winner = ranked[0];
  const exactTie =
    !!winner &&
    !!me &&
    winner.user_id !== me.user_id &&
    me.score === winner.score &&
    me.total_ms === winner.total_ms;
  const iWon = !!winner && !!me && (winner.user_id === me.user_id || exactTie);
  useEffect(() => {
    if (!iWon || !room) {
      setShowNudge(false);
      return;
    }
    const { count } = recordWin("word-battle", `word-battle:${room.id}:${room.updated_at}`);
    setShowNudge(count >= NUDGE_AFTER_WINS);
  }, [iWon, room]);

  const startGame = async () => {
    const supabase = getSupabase();
    if (!supabase || !session || !isHost) return;
    setStarting(true);
    setActionError(null);
    /* The host draws the match from the verified banks; the server
       stores the ids, orders and correct display indices. */
    const draw = drawWordMatchQuestions();
    const { data, error } = await supabase.rpc("start_word_game", {
      p_room_id: roomId,
      p_question_ids: draw.ids,
      p_orders: draw.orders,
      p_correct: draw.correct,
    });
    setStarting(false);
    if (!error && data === true) void fetchRoom();
    else setActionError(t.word.multi.actionFailed);
  };

  const leaveRoom = async () => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    setLeaving(true);
    await supabase.rpc("leave_word_room", { p_room_id: roomId });
    router.push("/games/word-battle");
  };

  const joinThisRoom = async () => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    setJoining(true);
    setJoinError(null);
    const { data, error } = await supabase.rpc("join_word_room", { p_room_id: roomId });
    setJoining(false);
    if (!error && data === true) void fetchRoom();
    else setJoinError(t.word.multi.joinFailed);
  };

  const playAgain = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setPlayingAgain(true);
    const { data, error } = await supabase.rpc("play_again_word", { p_room_id: roomId });
    setPlayingAgain(false);
    if (!error && data === true) void fetchRoom();
    else router.push("/games/word-battle");
  };

  const submitAnswer = async (pick: number) => {
    const supabase = getSupabase();
    if (!supabase || !session || submitting) return;
    if (!room || room.status !== "playing" || room.phase !== "question" || iLeft) return;
    if (myPick !== null) return;
    setSubmitting(true);
    const { data, error } = await supabase.rpc("submit_word_answer", { p_room_id: roomId, p_pick: pick });
    setSubmitting(false);
    if (!error && data === true) {
      setMyPick(pick);
      void fetchRoom();
    } else {
      setActionError(t.word.multi.actionFailed);
    }
  };

  /* Share the code via Game Chat — manual, like Ludo/Draw & Guess
     codes: the share text lands in the chat composer for the player
     to review and send themselves. Nothing is ever sent
     automatically. */
  const sendCodeToChat = () => {
    if (!room) return;
    try {
      sessionStorage.setItem(GAME_CHAT_PREFILL_KEY, t.word.multi.shareMessage(room.code));
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
          {t.word.multi.loading}
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t.word.multi.loading}
        </p>
      </div>
    );
  }

  if (status === "gone" || !room) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-4">
        <p className="card w-full p-5 text-sm font-medium">{goneStarted ? t.word.multi.notMember : t.word.multi.roomGone}</p>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/word-battle")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.word.multi.backToLobby}
        </button>
      </div>
    );
  }

  const spectatorBanner = (
    <div
      className="card flex items-start gap-3 p-4"
      style={{ background: "color-mix(in srgb, var(--gold) 8%, var(--card))" }}
    >
      <Eye size={19} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{t.word.multi.spectatorBanner}</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.word.multi.spectatorNote}
        </p>
      </div>
    </div>
  );

  /* Non-member view of a WAITING room: offer to join. Non-members
     opening a playing or finished room fall through to the spectator
     views below — live board + scores, no controls, no chat. */
  if (!isMember && room.status === "waiting") {
    const seatFree =
      room.status === "waiting" && room.players.length < room.max_players && isWordRoomFresh(room.updated_at, Date.now());
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="card p-5">
          <p className="text-sm font-medium">{seatFree ? t.word.multi.waitingTitle : t.word.multi.notMember}</p>
          <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em]">{room.code}</p>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.word.multi.seatsTaken(room.players.length, room.max_players)}
          </p>
          {joinError && (
            <p role="alert" className="mt-2 text-sm font-medium" style={{ color: "#C44D45" }}>
              {joinError}
            </p>
          )}
          {seatFree && (
            <button type="button" className="btn btn-gold mt-4" onClick={() => void joinThisRoom()} disabled={joining}>
              {joining ? t.word.multi.joining : t.word.multi.join}
            </button>
          )}
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/word-battle")}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t.word.multi.backToLobby}
        </button>
      </div>
    );
  }

  /* Waiting view. */
  if (room.status === "waiting") {
    const canStart = room.players.filter((p) => !p.has_left).length >= 2;
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
            {t.word.multi.waitingTitle}
          </h1>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            {t.word.multi.roomCode}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span ref={codeTextRef} className="font-mono text-4xl font-bold tracking-[0.3em] select-text">
              {room.code}
            </span>
            <button type="button" className="btn btn-ghost" onClick={() => void copyCode()}>
              {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
              {copied ? t.word.multi.copied : t.word.multi.copyCode}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => sendCodeToChat()}>
              <Send size={16} aria-hidden="true" />
              {t.word.multi.sendToChat}
            </button>
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.word.multi.shareHint}
          </p>

          <h2 className="mt-6 text-sm font-semibold">
            {t.word.multi.playersInRoom} · {t.word.multi.seatsTaken(room.players.length, room.max_players)}
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
                {p.user_id === room.host_id && <span className="chip">{t.word.multi.hostLabel}</span>}
                {p.user_id === session.id && <span className="chip">{t.ludo.you}</span>}
              </div>
            ))}
          </div>

          {canStart ? (
            isHost ? (
              <button type="button" className="btn btn-gold mt-5" onClick={() => void startGame()} disabled={starting}>
                <Zap size={17} aria-hidden="true" />
                {t.word.multi.startNow}
              </button>
            ) : (
              <p className="mt-4 text-sm font-medium">{t.word.multi.waitingForHost}</p>
            )
          ) : (
            <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
              {t.word.multi.needMore} {t.word.multi.startWhenReady}
            </p>
          )}
          {isHost && canStart && (
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              {t.word.multi.matchNote}
            </p>
          )}

          <div className="mt-6">
            <button type="button" className="btn btn-ghost" onClick={() => void leaveRoom()} disabled={leaving}>
              <LogOut size={16} aria-hidden="true" />
              {t.word.multi.leaveRoom}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Finished view: final scoreboard. Spectators see the same
     scoreboard but no post-match line, no nudge, no review and no
     Play Again — they didn't play. */
  if (room.status === "finished") {
    const myAnswers = room.all_answers.filter((a) => a.user_id === session.id);
    const reviewRows = room.question_ids
      .map((qid, i) => {
        const bq = resolveWordMatchQuestion(qid, room.question_orders[i] ?? [0, 1, 2, 3]);
        if (!bq) return null;
        const mine = myAnswers.find((a) => a.q_index === i);
        return { number: i + 1, bq, myPick: mine ? mine.picked : null, myCorrect: mine ? mine.correct : false };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => Number(a.myCorrect) - Number(b.myCorrect));
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {!isMember && spectatorBanner}
        <div className="card p-5 sm:p-6">
          <h1 className="font-serif-d flex items-center gap-2 text-2xl font-semibold">
            <Trophy size={22} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
            {t.word.multi.finalTitle}
          </h1>
          {winner && (
            <p className="mt-2 text-sm font-medium">
              {exactTie
                ? t.word.multi.tieWinner
                : winner.user_id === session.id
                  ? t.word.multi.youWon
                  : t.word.multi.winnerWon(winner.name)}
            </p>
          )}
          {isMember && winner && (
            <p className="mt-2 text-base font-bold" style={{ color: "var(--gold-deep)" }}>
              {pickPostMatchLine(iWon ? "win" : "loss", `word-battle:${room.id}:${room.updated_at}`)}
            </p>
          )}
          {isMember && iWon && showNudge && (
            <p
              className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--surface2)", color: "var(--gold-deep)" }}
            >
              {ADOBE_STOCK_NUDGE}
            </p>
          )}
          <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
            {t.word.multi.fastestWins}
          </p>
          <div className="mt-3 grid gap-2">
            {ranked.map((p, i) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: "var(--surface2)" }}
              >
                <span className="font-serif-d w-6 text-center text-lg font-bold">{i + 1}</span>
                <LudoAvatar url={p.avatar_url} name={p.name} size={36} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                {p.has_left && <span className="chip">{t.word.multi.leftLabel}</span>}
                {p.user_id === session.id && <span className="chip">{t.ludo.you}</span>}
                <span className="text-right text-sm">
                  <span className="font-bold" style={{ color: "var(--gold-deep)" }}>
                    {t.word.multi.marks(p.score)}
                  </span>
                  <span className="block text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                    {t.word.multi.timeSeconds(p.total_ms)}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {isMember ? (
              <>
                <button type="button" className="btn btn-gold" onClick={() => void playAgain()} disabled={playingAgain}>
                  <RotateCcw size={16} aria-hidden="true" />
                  {t.word.multi.playAgain}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/word-battle")}>
                  <LogOut size={16} aria-hidden="true" />
                  {t.word.multi.leaveRoom}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/word-battle")}>
                <ArrowLeft size={16} aria-hidden="true" />
                {t.word.multi.backToLobby}
              </button>
            )}
          </div>
        </div>

        {/* Review: members only, wrong answers first (solo pattern). */}
        {isMember && reviewRows.length > 0 && (
          <section>
            <h2 className="font-serif-d text-lg font-semibold">{t.word.reviewTitle}</h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {t.word.reviewHint}
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {reviewRows.map((rec) => {
                const entry = rec.bq.entry;
                const opts = wordOptions(rec.bq);
                const correctIdx = correctWordDisplayIndex(rec.bq);
                return (
                  <article
                    key={entry.id}
                    className="card p-4"
                    style={rec.myCorrect ? undefined : { borderColor: RED }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold leading-relaxed">
                        {t.word.questionOf(rec.number, WORD_MATCH_QUESTIONS)} — {entry.word}
                      </p>
                      {rec.myPick === null ? (
                        <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          {t.word.noAnswer}
                        </span>
                      ) : rec.myCorrect ? (
                        <Check size={18} className="shrink-0" style={{ color: GREEN }} aria-hidden="true" />
                      ) : (
                        <X size={18} className="shrink-0" style={{ color: RED }} aria-hidden="true" />
                      )}
                    </div>
                    {rec.myPick !== null && (
                      <p className="mt-2 text-sm">
                        <span style={{ color: "var(--muted)" }}>{t.word.yourAnswer}: </span>
                        <span style={{ color: rec.myCorrect ? GREEN : RED, fontWeight: 600 }}>
                          {opts[rec.myPick]}
                        </span>
                      </p>
                    )}
                    {!rec.myCorrect && (
                      <p className="mt-1 text-sm">
                        <span style={{ color: "var(--muted)" }}>{t.word.correctAnswer}: </span>
                        <span style={{ color: GREEN, fontWeight: 600 }}>{opts[correctIdx]}</span>
                      </p>
                    )}
                    <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                      <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
                      &ldquo;{entry.example}&rdquo;
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  /* Playing view. */
  const endsAt = room.question_ends_at ? new Date(room.question_ends_at).getTime() : null;
  const remainingMs = endsAt !== null ? Math.max(0, endsAt - now) : 0;
  const remainingSec = Math.ceil(remainingMs / 1000);
  const phaseTotal = room.phase === "reveal" ? WORD_REVEAL_MS : WORD_QUESTION_MS;
  const barPct = endsAt !== null ? Math.min(100, Math.max(0, (remainingMs / phaseTotal) * 100)) : 0;
  const lowTime = room.phase === "question" && remainingMs <= 5000;
  const bq =
    room.status === "playing" && room.question_id && room.question_order
      ? resolveWordMatchQuestion(room.question_id, room.question_order)
      : null;
  const revealing = room.phase === "reveal";
  const iAnswered = me?.answered === true || myPick !== null;

  const displayOptions = (b: NonNullable<typeof bq>): string[] => wordOptions(b);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {actionError && (
        <p role="alert" className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
          {actionError}
        </p>
      )}
      {/* Spectators watch the same live board: the question + options
          are visible (everyone in the Gaming Zone knows the banks),
          but there is no answer button and no chat. */}
      {!isMember && spectatorBanner}
      {isMember && iLeft && (
        <p className="card p-3 text-sm font-medium" style={{ color: "#C44D45" }}>
          {t.word.multi.leaveGameNote}
        </p>
      )}

      {/* Live scoreboard strip. */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs" style={{ color: "var(--muted)" }}>
          <span>{t.word.questionOf(room.current_q + 1, WORD_MATCH_QUESTIONS)}</span>
          <span className="font-mono font-bold tracking-widest" style={{ color: "var(--text)" }}>
            {room.code}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {rankWordPlayers(room.players).map((p) => (
            <div key={p.user_id} className="flex items-center gap-2">
              <LudoAvatar url={p.avatar_url} name={p.name} size={28} />
              <span className="w-24 shrink-0 truncate text-sm font-semibold">{p.name}</span>
              <div className="progress flex-1">
                <div
                  style={{
                    width: `${(p.score / WORD_MATCH_QUESTIONS) * 100}%`,
                    background: p.user_id === session.id ? "var(--gold)" : "#3E7BFA",
                  }}
                />
              </div>
              <span className="w-14 text-right text-sm font-bold tabular-nums">
                {t.word.multi.marks(p.score)}
              </span>
              {p.answered && room.phase === "question" && (
                <Check size={15} style={{ color: GREEN }} aria-label={t.word.multi.answeredNote} />
              )}
              {p.has_left && <span className="chip !py-0.5 text-[11px]">{t.word.multi.leftLabel}</span>}
            </div>
          ))}
        </div>
        {/* Question progress dots */}
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {Array.from({ length: WORD_MATCH_QUESTIONS }, (_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{
                background:
                  i < room.current_q
                    ? "var(--gold)"
                    : i === room.current_q
                      ? "var(--gold)"
                      : "var(--line)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Question card */}
      {bq ? (
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="chip">
              {t.word.levels[
                bq.entry.level === "basic"
                  ? "levelBasic"
                  : bq.entry.level === "intermediate"
                    ? "levelIntermediate"
                    : "levelAdvanced"
              ]}
            </span>
            <span
              className="flex items-center gap-1.5 text-sm font-bold tabular-nums"
              style={{ color: lowTime ? RED : "var(--muted)" }}
              aria-label={t.word.timeLeft}
            >
              <Clock size={15} aria-hidden="true" />
              {revealing ? "0" : remainingSec}s
            </span>
          </div>
          <div className="progress mt-3" aria-hidden="true">
            <div
              style={{
                width: `${revealing ? 0 : barPct}%`,
                background: lowTime ? RED : "var(--gold)",
                transition: "width 100ms linear",
              }}
            />
          </div>

          <h2 className="font-serif-d mt-4 text-center text-3xl font-bold leading-snug">
            {bq.entry.word}
          </h2>
          <p className="mt-2 text-center text-sm" style={{ color: "var(--muted)" }}>
            {t.word.meaningPrompt}
          </p>
          <p className="mt-3 text-center text-sm italic leading-relaxed" style={{ color: "var(--muted)" }}>
            &ldquo;{bq.entry.example}&rdquo;
          </p>

          <div className="mt-4 flex flex-col gap-2" role="group">
            {displayOptions(bq).map((opt, i) => {
              const correctIdx = room.reveal?.correct;
              const isCorrect = revealing && correctIdx === i;
              const isMyPick = myPick === i;
              const showState = revealing && room.reveal !== null;
              const borderColor = showState
                ? isCorrect
                  ? GREEN
                  : isMyPick
                    ? RED
                    : "var(--line)"
                : "var(--line)";
              const bg = showState
                ? isCorrect
                  ? "color-mix(in srgb, #2FA36B 12%, transparent)"
                  : isMyPick
                    ? "color-mix(in srgb, #E5484D 10%, transparent)"
                    : "transparent"
                : "transparent";
              return (
                <button
                  key={i}
                  type="button"
                  disabled={revealing || iAnswered || !isMember || iLeft}
                  onClick={() => void submitAnswer(i)}
                  className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-sm font-medium transition-colors sm:px-4"
                  style={{ borderColor, background: bg }}
                  aria-pressed={isMyPick}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: showState && isCorrect ? GREEN : "var(--surface2)",
                      color: showState && isCorrect ? "#fff" : "inherit",
                    }}
                  >
                    {showState && isCorrect ? (
                      <Check size={15} aria-hidden="true" />
                    ) : showState && isMyPick ? (
                      <X size={15} aria-hidden="true" />
                    ) : (
                      OPTION_LETTERS[i]
                    )}
                  </span>
                  <span className="min-w-0 flex-1 leading-relaxed">{opt}</span>
                  {showState && isMyPick && (
                    <span className="chip shrink-0 !py-0.5 text-[11px]">{t.word.yourAnswer}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Answered state while the question is still open. */}
          {!revealing && isMember && !iLeft && iAnswered && (
            <p className="mt-4 text-center text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>
              {t.word.multi.answeredNote}
            </p>
          )}

          {/* Reveal panel: correct answer + every player's pick. */}
          {revealing && room.reveal && (
            <div className="mt-4">
              <p className="text-base font-semibold" style={{ color: GREEN }}>
                {t.word.multi.revealTitle}: {displayOptions(bq)[room.reveal.correct]}
              </p>
              <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
                &ldquo;{bq.entry.example}&rdquo;
              </p>
              <div className="mt-3 grid gap-2">
                {rankWordPlayers(room.players).map((p) => {
                  const ans = room.reveal?.answers.find((a) => a.user_id === p.user_id);
                  return (
                    <div
                      key={p.user_id}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                      style={{ background: "var(--surface2)" }}
                    >
                      <LudoAvatar url={p.avatar_url} name={p.name} size={28} />
                      <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                      {ans ? (
                        <>
                          <span className="min-w-0 flex-1 truncate" style={{ color: ans.correct ? GREEN : RED }}>
                            {displayOptions(bq)[ans.picked]}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                            {t.word.multi.timeSeconds(ans.ms)}
                          </span>
                          {ans.correct ? (
                            <Check size={15} className="shrink-0" style={{ color: GREEN }} aria-hidden="true" />
                          ) : (
                            <X size={15} className="shrink-0" style={{ color: RED }} aria-hidden="true" />
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          {t.word.noAnswer}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-xs" style={{ color: "var(--muted)" }}>
                {t.word.autoNext}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-5">
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t.word.multi.loading}
          </p>
        </div>
      )}

      {isMember ? (
        <div className="card p-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.word.multi.leaveGameNote}
          </p>
          <button type="button" className="btn btn-ghost mt-3" onClick={() => void leaveRoom()} disabled={leaving}>
            <LogOut size={16} aria-hidden="true" />
            {t.word.multi.leaveRoom}
          </button>
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/word-battle")}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t.word.multi.backToLobby}
          </button>
        </div>
      )}
    </div>
  );
}
