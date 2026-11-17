"use client";

/* Arrows Out — solo logic puzzle. Tap an arrow to slide it off the
   board, but only when its straight lane to the edge is clear. A
   blocked arrow costs a heart (3 per attempt). 30 levels, sequential
   unlock, stars for hearts remaining. Progress lives in localStorage
   only (per-device) — no database table, no Supabase calls. */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Heart,
  Lightbulb,
  Lock,
  Play,
  RotateCcw,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { SectionHeader } from "@/components/ui";
import { ARROWS_LEVELS, levelBoard } from "@/lib/arrows-out/levels";
import {
  countArrows,
  findClearableArrow,
  laneIsClear,
  type Board,
  type BoardPos,
  type Direction,
} from "@/lib/arrows-out/solver";
import {
  isSoundEnabled,
  playButtonClick,
  playCapture,
  playTokenPop,
  playTurnChime,
  playWinFanfare,
  setSoundEnabled,
  unlockAudio,
} from "@/lib/ludo/sounds";

const HEARTS_PER_ATTEMPT = 3;
const HINTS_PER_ATTEMPT = 3;
const EXIT_MS = 280;
const BUMP_MS = 350;
const FAIL_DELAY_MS = 450;
const HINT_GLOW_MS = 2000;
const NOTE_MS = 3000;
const STARS_KEY = "ssc:arrows-out:stars";

type StarsMap = Record<number, number>;
type View = "levels" | "play";
type Phase = "playing" | "won" | "failed";

/** One consistent colour per direction, readable in both themes. */
const DIRECTION_COLORS: Record<Direction, string> = {
  up: "#E5484D",
  right: "#2FA36B",
  down: "#3E7BFA",
  left: "#8E4EC6",
};

const DIRECTION_ICONS: Record<Direction, typeof ArrowUp> = {
  up: ArrowUp,
  right: ArrowRight,
  down: ArrowDown,
  left: ArrowLeft,
};

/** Slide-out distance: far enough to fly visibly off the board. */
const EXIT_TRANSLATE: Record<Direction, string> = {
  up: "translateY(-320px)",
  down: "translateY(320px)",
  left: "translateX(-320px)",
  right: "translateX(320px)",
};

function loadStars(): StarsMap {
  try {
    const raw = window.localStorage.getItem(STARS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: StarsMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(k);
      if (Number.isInteger(n) && n >= 1 && n <= ARROWS_LEVELS.length && (v === 1 || v === 2 || v === 3)) {
        out[n] = v as number;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export default function ArrowsOutPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [stars, setStars] = useState<StarsMap>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [view, setView] = useState<View>("levels");
  const [levelN, setLevelN] = useState(1);
  const [board, setBoard] = useState<Board>(() => levelBoard(ARROWS_LEVELS[0]));
  const [hearts, setHearts] = useState(HEARTS_PER_ATTEMPT);
  const [moves, setMoves] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_ATTEMPT);
  const [phase, setPhase] = useState<Phase>("playing");
  const [exiting, setExiting] = useState<(BoardPos & { dir: Direction }) | null>(null);
  const [bumping, setBumping] = useState<(BoardPos & { key: number }) | null>(null);
  const [hintCell, setHintCell] = useState<BoardPos | null>(null);
  const [hintNote, setHintNote] = useState(false);

  const heartsRef = useRef(hearts);
  const timersRef = useRef<number[]>([]);
  const bumpKeyRef = useRef(0);

  useEffect(() => {
    heartsRef.current = hearts;
  }, [hearts]);

  useEffect(() => {
    setStars(loadStars());
    setProgressLoaded(true);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const isUnlocked = useCallback(
    (n: number) => n === 1 || (stars[n - 1] ?? 0) > 0,
    [stars],
  );

  const startLevel = useCallback(
    (n: number) => {
      clearTimers();
      setLevelN(n);
      setBoard(levelBoard(ARROWS_LEVELS[n - 1]));
      setHearts(HEARTS_PER_ATTEMPT);
      setMoves(0);
      setHintsLeft(HINTS_PER_ATTEMPT);
      setPhase("playing");
      setExiting(null);
      setBumping(null);
      setHintCell(null);
      setHintNote(false);
      setView("play");
    },
    [clearTimers],
  );

  const saveStars = useCallback(
    (n: number, earned: number) => {
      setStars((prev) => {
        const best = Math.max(prev[n] ?? 0, earned);
        if (best === prev[n]) return prev;
        const next = { ...prev, [n]: best };
        try {
          window.localStorage.setItem(STARS_KEY, JSON.stringify(next));
        } catch {
          // Private mode / quota: progress just won't persist.
        }
        return next;
      });
    },
    [],
  );

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playButtonClick();
  }, [soundOn]);

  const handleTap = useCallback(
    (row: number, col: number) => {
      if (phase !== "playing" || hearts <= 0 || exiting || bumping) return;
      const dir = board[row]?.[col];
      if (!dir) return;
      unlockAudio();
      if (laneIsClear(board, row, col)) {
        playTokenPop();
        setExiting({ row, col, dir });
        setMoves((m) => m + 1);
        setHintCell(null);
        later(() => {
          const next = board.map((r) => [...r]);
          next[row][col] = null;
          setBoard(next);
          setExiting(null);
          if (countArrows(next) === 0) {
            setPhase("won");
            playWinFanfare();
            saveStars(levelN, Math.max(1, heartsRef.current));
          }
        }, EXIT_MS);
      } else {
        playCapture();
        bumpKeyRef.current += 1;
        setBumping({ row, col, key: bumpKeyRef.current });
        const remaining = heartsRef.current - 1;
        setHearts(remaining);
        later(() => setBumping(null), BUMP_MS);
        if (remaining <= 0) {
          later(() => setPhase("failed"), FAIL_DELAY_MS);
        }
      }
    },
    [board, bumping, exiting, hearts, heartsRef, later, levelN, phase, saveStars],
  );

  const useHint = useCallback(() => {
    if (phase !== "playing" || hearts <= 0 || exiting || bumping) return;
    unlockAudio();
    if (hintsLeft <= 0) {
      setHintNote(true);
      later(() => setHintNote(false), NOTE_MS);
      return;
    }
    const found = findClearableArrow(board);
    if (!found) {
      setHintNote(true);
      later(() => setHintNote(false), NOTE_MS);
      return;
    }
    playTurnChime();
    setHintsLeft((h) => h - 1);
    setHintCell(found);
    later(() => setHintCell(null), HINT_GLOW_MS);
  }, [board, bumping, exiting, hearts, hintsLeft, later, phase]);

  const dirName = useCallback(
    (dir: Direction) =>
      dir === "up" ? t.arrows.dirUp : dir === "down" ? t.arrows.dirDown : dir === "left" ? t.arrows.dirLeft : t.arrows.dirRight,
    [t],
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

  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);
  const size = board.length;
  const isLastLevel = levelN >= ARROWS_LEVELS.length;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <SectionHeader
        title={t.arrows.title}
        subtitle={t.arrows.tagline}
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

      {view === "levels" ? (
        <>
          <div className="card p-5">
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.arrows.howTo}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
              <Star size={16} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.arrows.starsLabel}: {progressLoaded ? totalStars : 0} / {ARROWS_LEVELS.length * 3}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {t.arrows.progressNote}
            </p>
          </div>

          <h2 className="font-serif-d text-lg font-semibold">{t.arrows.levelSelect}</h2>
          <div className="grid grid-cols-5 gap-2" role="group" aria-label={t.arrows.levelSelect}>
            {ARROWS_LEVELS.map((lv) => {
              const unlocked = isUnlocked(lv.n);
              const earned = stars[lv.n] ?? 0;
              return (
                <button
                  key={lv.n}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    playButtonClick();
                    startLevel(lv.n);
                  }}
                  aria-label={
                    unlocked ? `${t.arrows.level(lv.n)} — ${earned}/3 ${t.arrows.starsLabel}` : `${t.arrows.level(lv.n)} — ${t.arrows.locked}`
                  }
                  className="card flex aspect-square flex-col items-center justify-center gap-1 p-1 disabled:opacity-50"
                  style={
                    unlocked
                      ? undefined
                      : { background: "var(--surface2)" }
                  }
                >
                  {unlocked ? (
                    <>
                      <span className="font-serif-d text-lg leading-none font-bold">{lv.n}</span>
                      <span className="flex gap-[1px]" aria-hidden="true">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            size={10}
                            style={{ color: s <= earned ? "var(--gold-deep)" : "var(--line)" }}
                            fill={s <= earned ? "currentColor" : "none"}
                          />
                        ))}
                      </span>
                    </>
                  ) : (
                    <Lock size={18} style={{ color: "var(--muted)" }} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* HUD: back, level title, hearts / moves / hints. */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                playButtonClick();
                clearTimers();
                setExiting(null);
                setBumping(null);
                setHintCell(null);
                setView("levels");
              }}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {t.arrows.backToLevels}
            </button>
            <h2 className="font-serif-d text-lg font-semibold">{t.arrows.level(levelN)}</h2>
            <span className="w-10 shrink-0" aria-hidden="true" />
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2"
            style={{ background: "var(--surface2)" }}
          >
            <span
              className="flex items-center gap-1"
              role="img"
              aria-label={t.arrows.heartsLeft(hearts)}
            >
              {[1, 2, 3].map((h) => (
                <Heart
                  key={h}
                  size={20}
                  style={{ color: h <= hearts ? "#E5484D" : "var(--line)" }}
                  fill={h <= hearts ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              ))}
            </span>
            <span className="text-sm font-semibold">
              {t.arrows.moves}: {moves}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Lightbulb size={16} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.arrows.hints}: {hintsLeft}
            </span>
          </div>

          {phase === "playing" ? (
            <>
              <div
                className="mx-auto grid w-full max-w-[480px] gap-1 sm:gap-1.5"
                style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
                role="group"
                aria-label={t.arrows.boardLabel}
              >
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    if (cell === null) {
                      return (
                        <span
                          key={`${r}-${c}`}
                          className="aspect-square rounded-lg"
                          style={{ background: "var(--surface2)" }}
                          aria-hidden="true"
                        />
                      );
                    }
                    const Icon = DIRECTION_ICONS[cell];
                    const isExiting = exiting?.row === r && exiting?.col === c;
                    const isBumping = bumping?.row === r && bumping?.col === c;
                    const isHint = hintCell?.row === r && hintCell?.col === c;
                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        onClick={() => handleTap(r, c)}
                        aria-label={t.arrows.arrowAt(dirName(cell), r + 1, c + 1)}
                        className={`flex aspect-square items-center justify-center rounded-lg text-white transition-all duration-300 ${
                          isBumping ? "arrows-shake" : ""
                        } ${isHint ? "arrows-hint" : ""}`}
                        style={{
                          background: DIRECTION_COLORS[cell],
                          transform: isExiting ? EXIT_TRANSLATE[cell] : undefined,
                          opacity: isExiting ? 0 : 1,
                          boxShadow: isBumping ? "0 0 0 3px #E5484D" : undefined,
                        }}
                      >
                        <Icon className="h-[62%] w-[62%]" aria-hidden="true" />
                      </button>
                    );
                  }),
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={useHint}
                  disabled={hintsLeft <= 0}
                >
                  <Lightbulb size={16} aria-hidden="true" />
                  {t.arrows.hintButton} ({hintsLeft})
                </button>
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => {
                    playButtonClick();
                    startLevel(levelN);
                  }}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  {t.arrows.restart}
                </button>
              </div>
              {hintNote && (
                <p role="status" className="text-center text-sm font-medium" style={{ color: "var(--gold-deep)" }}>
                  {t.arrows.noHints}
                </p>
              )}
            </>
          ) : phase === "won" ? (
            <div className="card p-5 text-center sm:p-6">
              <Trophy size={32} className="mx-auto" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              <h2 className="font-serif-d mt-2 text-2xl font-semibold">{t.arrows.winTitle}</h2>
              <p className="mt-2 flex items-center justify-center gap-1" aria-label={`${hearts}/3 ${t.arrows.starsLabel}`}>
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={30}
                    style={{ color: s <= hearts ? "var(--gold-deep)" : "var(--line)" }}
                    fill={s <= hearts ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                ))}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {t.arrows.winSub(moves)}
              </p>
              {isLastLevel && (
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>
                  {t.arrows.allCleared}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                {!isLastLevel && (
                  <button
                    type="button"
                    className="btn btn-gold flex-1"
                    onClick={() => {
                      playButtonClick();
                      startLevel(levelN + 1);
                    }}
                  >
                    <Play size={17} aria-hidden="true" />
                    {t.arrows.nextLevel}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => {
                    playButtonClick();
                    startLevel(levelN);
                  }}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  {t.arrows.replay}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => {
                    playButtonClick();
                    setView("levels");
                  }}
                >
                  {t.arrows.backToLevels}
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-5 text-center sm:p-6">
              <Heart size={32} className="mx-auto" style={{ color: "#E5484D" }} aria-hidden="true" />
              <h2 className="font-serif-d mt-2 text-2xl font-semibold">{t.arrows.failTitle}</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {t.arrows.failSub}
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="btn btn-gold flex-1"
                  onClick={() => {
                    playButtonClick();
                    startLevel(levelN);
                  }}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  {t.arrows.retry}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => {
                    playButtonClick();
                    setView("levels");
                  }}
                >
                  {t.arrows.backToLevels}
                </button>
              </div>
            </div>
          )}
        </>
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
