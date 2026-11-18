"use client";

/* Chess vs Sweet AI: pick a difficulty and a colour, then play on the
   shared board. Undo takes back the last pair of moves; resign ends
   the game. Wins count toward the session Adobe Stock nudge (3 wins)
   via the shared recordWin helper — no motivation line (Bubble
   Shooter only). */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Flag, RotateCcw, SwitchCamera, Volume2, VolumeX } from "lucide-react";
import type { PieceSymbol } from "chess.js";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { SectionHeader } from "@/components/ui";
import { ChessBoard, ChessMoveList, PieceView, type BoardMove } from "@/components/ChessBoard";
import { chooseAiMove, type ChessDifficulty } from "@/lib/chess/engine";
import { capturedPieces, chessFromFen, gameOverFromHistory, materialDiff, START_FEN } from "@/lib/chess/position";
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
import { ADOBE_STOCK_NUDGE, NUDGE_AFTER_WINS, recordWin } from "@/lib/games/win-motivation";
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

type Phase = "setup" | "playing";

const DIFFICULTIES: ChessDifficulty[] = ["easy", "medium", "hard"];

export default function ChessSoloPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("setup");
  const [difficulty, setDifficulty] = useState<ChessDifficulty>("medium");
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [theme, setTheme] = useState<ChessThemeId>("wooden");
  const [pieceStyle, setPieceStyle] = useState<ChessPieceStyle>("realistic");
  const [soundOn, setSoundOn] = useState(true);

  const [fens, setFens] = useState<string[]>([START_FEN]);
  const [sans, setSans] = useState<string[]>([]);
  const [gameKey, setGameKey] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);
  const [resigned, setResigned] = useState(false);
  const [resignArmed, setResignArmed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  const aiTimerRef = useRef<number | null>(null);
  const fanfareRef = useRef(false);

  const fen = fens[fens.length - 1];
  const chess = useMemo(() => chessFromFen(fen), [fen]);
  /* History-aware: threefold repetition needs the SAN list, not
     just the final FEN. */
  const over = useMemo(() => gameOverFromHistory(fen, sans), [fen, sans]);
  const isOver = over !== null || resigned;
  const turn = chess.turn();
  const isPlayerTurn = !isOver && turn === playerColor;
  const orientation: "w" | "b" = flipped ? (playerColor === "w" ? "b" : "w") : playerColor;

  /* Last-move highlight: replay the SAN list from the start — a
     Chess instance built from the final FEN has an empty history,
     so history() on `chess` would never yield the last move. */
  const lastMove = useMemo(() => {
    if (sans.length === 0) return null;
    const replay = chessFromFen(START_FEN);
    try {
      for (const san of sans) replay.move(san);
    } catch {
      return null;
    }
    const verbose = replay.history({ verbose: true });
    const last = verbose[verbose.length - 1];
    return last ? { from: last.from, to: last.to } : null;
  }, [sans]);

  // Load persisted board preferences + sound state on mount.
  useEffect(() => {
    setTheme(loadChessTheme());
    setPieceStyle(loadChessPieceStyle());
    setSoundOn(isSoundEnabled());
  }, []);

  useEffect(
    () => () => {
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    },
    [],
  );

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playButtonClick();
  }, [soundOn]);

  const applyMoveSounds = useCallback((san: string, captured: boolean) => {
    if (captured) playChessCapture();
    else if (san.includes("+") || san.includes("#")) playChessCheck();
    else playChessMove();
  }, []);

  /** Apply a legal move object to the game state. Returns false when
      chess.js rejects the move (should not happen — the board only
      offers legal targets). */
  const applyMove = useCallback(
    (move: BoardMove): boolean => {
      const next = chessFromFen(fen);
      let made;
      try {
        made = next.move({ from: move.from, to: move.to, promotion: move.promotion });
      } catch {
        return false;
      }
      applyMoveSounds(made.san, Boolean(made.captured));
      setFens((prev) => [...prev, next.fen()]);
      setSans((prev) => [...prev, made.san]);
      setResignArmed(false);
      return true;
    },
    [fen, applyMoveSounds],
  );

  const handlePlayerMove = useCallback(
    (move: BoardMove) => {
      if (!isPlayerTurn || aiThinking) return;
      unlockAudio();
      void applyMove(move);
    },
    [isPlayerTurn, aiThinking, applyMove],
  );

  /* Sweet AI's turn: think briefly (so the move reads as a turn, not
     an instant snap), then play. */
  useEffect(() => {
    if (phase !== "playing" || isOver || turn === playerColor) return;
    setAiThinking(true);
    aiTimerRef.current = window.setTimeout(() => {
      const aiMove = chooseAiMove(fen, difficulty);
      setAiThinking(false);
      if (aiMove) void applyMove(aiMove);
    }, 450);
    return () => {
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    };
  }, [phase, isOver, turn, playerColor, fen, difficulty, applyMove]);

  /* Win counting + fanfare: exactly once per finished game. */
  const iWon = (over?.kind === "checkmate" && over.winner === playerColor) || false;
  useEffect(() => {
    if (!isOver) return;
    if (iWon) {
      if (!fanfareRef.current) {
        fanfareRef.current = true;
        playChessWin();
      }
      const { count } = recordWin("chess", `chess-ai:${gameKey}`);
      setShowNudge(count >= NUDGE_AFTER_WINS);
    } else {
      setShowNudge(false);
    }
  }, [isOver, iWon, gameKey]);

  const startGame = () => {
    unlockAudio();
    playButtonClick();
    setFens([START_FEN]);
    setSans([]);
    setResigned(false);
    setResignArmed(false);
    setFlipped(false);
    setShowNudge(false);
    fanfareRef.current = false;
    setGameKey((k) => k + 1);
    setPhase("playing");
  };

  const undo = () => {
    if (aiThinking || sans.length === 0) return;
    unlockAudio();
    playButtonClick();
    // Take back the last pair of moves (AI + player); a single ply
    // when only one move exists.
    const remove = sans.length >= 2 ? 2 : 1;
    setFens((prev) => prev.slice(0, Math.max(1, prev.length - remove)));
    setSans((prev) => prev.slice(0, Math.max(0, prev.length - remove)));
    setResigned(false);
    setResignArmed(false);
    setShowNudge(false);
  };

  const resign = () => {
    if (!resignArmed) {
      setResignArmed(true);
      window.setTimeout(() => setResignArmed(false), 3000);
      return;
    }
    setResigned(true);
    setResignArmed(false);
  };

  const pickTheme = (id: ChessThemeId) => {
    setTheme(id);
    saveChessTheme(id);
  };
  const pickPieces = (style: ChessPieceStyle) => {
    setPieceStyle(style);
    saveChessPieceStyle(style);
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

  const themeNames: Record<ChessThemeId, string> = {
    wooden: t.chess.themeWooden,
    classic: t.chess.themeClassic,
    modern: t.chess.themeModern,
  };
  const pieceNames: Record<ChessPieceStyle, string> = {
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
            {pieceNames[style]}
          </button>
        ))}
      </div>
    </section>
  );

  if (phase === "setup") {
    const diffNames: Record<ChessDifficulty, string> = {
      easy: t.chess.difficultyEasy,
      medium: t.chess.difficultyMedium,
      hard: t.chess.difficultyHard,
    };
    const diffDescs: Record<ChessDifficulty, string> = {
      easy: t.chess.difficultyEasyDesc,
      medium: t.chess.difficultyMediumDesc,
      hard: t.chess.difficultyHardDesc,
    };
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <SectionHeader
          title={t.chess.vsAiTitle}
          subtitle={t.chess.howTo}
          action={
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
          }
        />
        <section className="card p-5">
          <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
            <Bot size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
            {t.chess.vsAiTitle}
          </h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3" role="group" aria-label={t.chess.vsAiTitle}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
                className={`rounded-xl border p-3 text-left ${difficulty === d ? "btn-active" : ""}`}
                style={{ borderColor: "var(--line)", background: difficulty === d ? undefined : "var(--surface)" }}
              >
                <span className="block text-sm font-bold">{diffNames[d]}</span>
                <span className="mt-1 block text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                  {diffDescs[d]}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-5 text-sm font-semibold">{t.chess.playAs}</p>
          <div className="mt-2 flex gap-2" role="group" aria-label={t.chess.playAs}>
            {(["w", "b"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPlayerColor(c)}
                aria-pressed={playerColor === c}
                className={`btn ${playerColor === c ? "btn-active" : "btn-ghost"}`}
              >
                {c === "w" ? t.chess.playWhite : t.chess.playBlack}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-gold mt-5" onClick={startGame}>
            {t.chess.startGame}
          </button>
        </section>
        {settingsCard}
        <div>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/games/chess")}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t.chess.backToLobby}
          </button>
        </div>
      </div>
    );
  }

  const captured = capturedPieces(fen);
  const diff = materialDiff(fen);
  const statusText = resigned
    ? t.chess.youLost
    : over?.kind === "checkmate"
      ? t.chess.checkmate
      : over
        ? t.chess.drawLabel
        : chess.isCheck()
          ? t.chess.check
          : aiThinking
            ? t.chess.thinking
            : isPlayerTurn
              ? t.chess.yourTurn
              : turn === "w"
                ? t.chess.whiteToMove
                : t.chess.blackToMove;

  const resultText = resigned
    ? t.chess.youLost
    : over?.kind === "checkmate"
      ? iWon
        ? t.chess.youWon
        : t.chess.youLost
      : over
        ? t.chess.drawResult
        : null;

  const capturedRow = (pieces: PieceSymbol[], color: "w" | "b", label: string) => (
    <div className="flex min-h-7 flex-wrap items-center gap-1">
      <span className="mr-1 text-xs font-semibold" style={{ color: "var(--muted)" }}>
        {label}
      </span>
      {pieces.length === 0 ? (
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          —
        </span>
      ) : (
        pieces.map((p, i) => (
          <span key={`${p}-${i}`} className="inline-block h-6 w-6">
            <PieceView type={p} color={color} style={pieceStyle} size="100%" />
          </span>
        ))
      )}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <SectionHeader
        title={t.chess.vsAiTitle}
        subtitle={playerColor === "w" ? t.chess.youAreWhite : t.chess.youAreBlack}
        action={
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
        }
      />

      {resultText && (
        <div className="card p-4 text-center">
          <p className="font-serif-d text-xl font-semibold">{resultText}</p>
          {iWon && showNudge && (
            <p
              className="mx-auto mt-3 max-w-md rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--surface2)", color: "var(--gold-deep)" }}
            >
              {ADOBE_STOCK_NUDGE}
            </p>
          )}
          <button type="button" className="btn btn-gold mt-4" onClick={startGame}>
            {t.chess.newGame}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="mx-auto w-full max-w-[560px] flex-1">
          <ChessBoard
            fen={fen}
            orientation={orientation}
            theme={theme}
            pieceStyle={pieceStyle}
            interactive={isPlayerTurn && !aiThinking}
            lastMove={lastMove}
            onMove={handlePlayerMove}
            boardLabel={t.chess.boardLabel}
            promotionTitle={t.chess.selectPromotion}
            pieceNames={t.chess.pieceNames}
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={undo}
              disabled={aiThinking || sans.length === 0}
            >
              <RotateCcw size={16} aria-hidden="true" />
              {t.chess.undo}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setFlipped((f) => !f)}>
              <SwitchCamera size={16} aria-hidden="true" />
              {t.chess.flipBoard}
            </button>
            {!isOver && (
              <button type="button" className="btn btn-ghost" onClick={resign}>
                <Flag size={16} aria-hidden="true" />
                {resignArmed ? t.chess.resignAgain : t.chess.resign}
              </button>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
          <section className="card p-4">
            <p className="text-sm font-bold" style={{ color: "var(--gold-deep)" }}>
              {statusText}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {turn === "w" ? t.chess.whiteToMove : t.chess.blackToMove}
              {diff !== 0 && ` · ${diff > 0 ? t.chess.playWhite : t.chess.playBlack} ${t.chess.materialAhead(Math.abs(diff))}`}
            </p>
            <div className="mt-3 space-y-2">
              {capturedRow(captured.byWhite, "b", t.chess.capturedLabel)}
              {capturedRow(captured.byBlack, "w", t.chess.capturedLabel)}
            </div>
          </section>
          <section className="card p-4">
            <h2 className="text-sm font-semibold">{t.chess.moveHistory}</h2>
            <div className="mt-2">
              <ChessMoveList sans={sans} emptyLabel={t.chess.movesEmpty} />
            </div>
          </section>
          {settingsCard}
          <button type="button" className="btn btn-ghost self-start" onClick={() => router.push("/games/chess")}>
            <ArrowLeft size={16} aria-hidden="true" />
            {t.chess.backToLobby}
          </button>
        </div>
      </div>
    </div>
  );
}
