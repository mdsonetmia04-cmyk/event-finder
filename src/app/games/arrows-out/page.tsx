"use client";

/* Arrows Out — solo logic puzzle, winding-arrow maze style. Each
   arrow is a winding line with an arrowhead; tap one to slide it out
   along its own path, but only when its way out (the straight lane
   from its head to the edge) is clear. A blocked arrow costs a
   heart (3 per attempt). 30 levels in three difficulty bands,
   sequential unlock, stars for hearts remaining. Progress lives in
   localStorage only (per-device) — no database table, no Supabase
   calls. */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
import { ARROWS_LEVELS, levelArrows, levelDifficulty, type ArrowsDifficulty } from "@/lib/arrows-out/levels";
import {
  arrowPathD,
  arrowheadPoints,
  DIRECTION_DELTAS,
  findRemovableArrow,
  headCell,
  headLaneClear,
  type Direction,
  type MazeArrow,
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
const EXIT_MS = 480;
const BUMP_MS = 350;
const FAIL_DELAY_MS = 450;
const HINT_GLOW_MS = 2000;
const NOTE_MS = 3000;
/** v2 key: the maze rebuild must not inherit grid-version progress. */
const STARS_KEY = "ssc:arrows-out:stars-v2";
/** ViewBox units per grid cell. */
const CELL = 10;

type StarsMap = Record<number, number>;
type View = "levels" | "play";
type Phase = "playing" | "won" | "failed";

const DIFFICULTY_DOT: Record<ArrowsDifficulty, string> = {
  normal: "#2FA36B",
  hard: "var(--gold-deep)",
  superHard: "#E5484D",
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
  const [arrows, setArrows] = useState<MazeArrow[]>(() => levelArrows(ARROWS_LEVELS[0]));
  const [removed, setRemoved] = useState<ReadonlySet<number>>(new Set());
  const [hearts, setHearts] = useState(HEARTS_PER_ATTEMPT);
  const [moves, setMoves] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_ATTEMPT);
  const [phase, setPhase] = useState<Phase>("playing");
  const [exitingId, setExitingId] = useState<number | null>(null);
  const [bumping, setBumping] = useState<{ id: number; key: number } | null>(null);
  const [hintId, setHintId] = useState<number | null>(null);
  const [hintNote, setHintNote] = useState(false);

  const heartsRef = useRef(hearts);
  const removedRef = useRef<ReadonlySet<number>>(new Set());
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
      setArrows(levelArrows(ARROWS_LEVELS[n - 1]));
      removedRef.current = new Set();
      setRemoved(new Set());
      setHearts(HEARTS_PER_ATTEMPT);
      setMoves(0);
      setHintsLeft(HINTS_PER_ATTEMPT);
      setPhase("playing");
      setExitingId(null);
      setBumping(null);
      setHintId(null);
      setHintNote(false);
      setView("play");
    },
    [clearTimers],
  );

  const saveStars = useCallback((n: number, earned: number) => {
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
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playButtonClick();
  }, [soundOn]);

  const handleTap = useCallback(
    (id: number) => {
      if (phase !== "playing" || hearts <= 0 || exitingId !== null || bumping) return;
      if (removedRef.current.has(id)) return;
      const size = ARROWS_LEVELS[levelN - 1].size;
      unlockAudio();
      if (headLaneClear(arrows, size, removedRef.current, id)) {
        playTokenPop();
        setExitingId(id);
        setMoves((m) => m + 1);
        setHintId(null);
        later(() => {
          const next = new Set(removedRef.current);
          next.add(id);
          removedRef.current = next;
          setRemoved(next);
          setExitingId(null);
          if (next.size === arrows.length) {
            setPhase("won");
            playWinFanfare();
            saveStars(levelN, Math.max(1, heartsRef.current));
          }
        }, EXIT_MS);
      } else {
        playCapture();
        bumpKeyRef.current += 1;
        setBumping({ id, key: bumpKeyRef.current });
        const remaining = heartsRef.current - 1;
        setHearts(remaining);
        later(() => setBumping(null), BUMP_MS);
        if (remaining <= 0) {
          later(() => setPhase("failed"), FAIL_DELAY_MS);
        }
      }
    },
    [arrows, bumping, exitingId, hearts, later, levelN, phase, saveStars],
  );

  const useHint = useCallback(() => {
    if (phase !== "playing" || hearts <= 0 || exitingId !== null || bumping) return;
    unlockAudio();
    if (hintsLeft <= 0) {
      setHintNote(true);
      later(() => setHintNote(false), NOTE_MS);
      return;
    }
    const size = ARROWS_LEVELS[levelN - 1].size;
    const found = findRemovableArrow(arrows, size, removedRef.current);
    if (found === null) {
      setHintNote(true);
      later(() => setHintNote(false), NOTE_MS);
      return;
    }
    playTurnChime();
    setHintsLeft((h) => h - 1);
    setHintId(found);
    later(() => setHintId(null), HINT_GLOW_MS);
  }, [arrows, bumping, exitingId, hearts, hintsLeft, later, levelN, phase]);

  const dirName = useCallback(
    (dir: Direction) =>
      dir === "up" ? t.arrows.dirUp : dir === "down" ? t.arrows.dirDown : dir === "left" ? t.arrows.dirLeft : t.arrows.dirRight,
    [t],
  );

  const difficultyName = useCallback(
    (d: ArrowsDifficulty) =>
      d === "normal" ? t.arrows.difficultyNormal : d === "hard" ? t.arrows.difficultyHard : t.arrows.difficultySuperHard,
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
  const size = ARROWS_LEVELS[levelN - 1].size;
  const difficulty = levelDifficulty(levelN);
  const isLastLevel = levelN >= ARROWS_LEVELS.length;
  const viewSpan = size * CELL + 12;

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
              const lvDifficulty = levelDifficulty(lv.n);
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
                    unlocked
                      ? `${t.arrows.level(lv.n)} — ${difficultyName(lvDifficulty)} — ${earned}/3 ${t.arrows.starsLabel}`
                      : `${t.arrows.level(lv.n)} — ${t.arrows.locked}`
                  }
                  className="card flex aspect-square flex-col items-center justify-center gap-1 p-1 disabled:opacity-50"
                  style={unlocked ? undefined : { background: "var(--surface2)" }}
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
                      <span
                        className="h-[6px] w-[6px] rounded-full"
                        style={{ background: DIFFICULTY_DOT[lvDifficulty] }}
                        title={difficultyName(lvDifficulty)}
                        aria-hidden="true"
                      />
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
          {/* HUD: back, level title, hearts / moves / hints / difficulty. */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                playButtonClick();
                clearTimers();
                setExitingId(null);
                setBumping(null);
                setHintId(null);
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
            <span className="flex items-center gap-1" role="img" aria-label={t.arrows.heartsLeft(hearts)}>
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
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                color: DIFFICULTY_DOT[difficulty],
                background: "color-mix(in srgb, currentColor 12%, transparent)",
              }}
            >
              {difficultyName(difficulty)}
            </span>
          </div>

          {phase === "playing" ? (
            <>
              <div
                className="mx-auto w-full max-w-[480px] rounded-2xl border p-2 sm:p-3"
                style={{ background: "var(--card)", borderColor: "var(--line)" }}
              >
                <svg
                  viewBox={`-6 -6 ${viewSpan} ${viewSpan}`}
                  className="block h-auto w-full"
                  role="group"
                  aria-label={t.arrows.boardLabel}
                >
                  {arrows.map((arrow) => {
                    if (removed.has(arrow.id)) return null;
                    const isExiting = exitingId === arrow.id;
                    const isBumping = bumping?.id === arrow.id;
                    const isHint = hintId === arrow.id;
                    const d = arrowPathD(arrow, CELL);
                    const head = headCell(arrow);
                    const { dr, dc } = DIRECTION_DELTAS[arrow.headDir];
                    const ink = isBumping ? "#E5484D" : isHint ? "var(--gold)" : undefined;
                    return (
                      <g
                        key={arrow.id}
                        className={isBumping ? "arrows-maze-shake" : isHint ? "arrows-maze-hint" : undefined}
                      >
                        {/* Visible winding line. On exit it retreats along its
                            own path (dashoffset 0 -> 1 with pathLength 1),
                            like a snake leaving head-first. */}
                        <path
                          d={d}
                          pathLength={1}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          pointerEvents="none"
                          className={`arrows-ink ${isExiting ? "arrows-maze-exit" : ""}`}
                          style={{
                            stroke: ink,
                            strokeWidth: isHint ? 3 : 2.2,
                            strokeDasharray: "1 1",
                            strokeDashoffset: isExiting ? 1 : 0,
                            transition: isExiting ? "stroke-dashoffset 0.45s linear" : undefined,
                          }}
                        />
                        {/* Arrowhead: fades and drifts out along the head
                            direction while the line retreats. */}
                        <polygon
                          points={arrowheadPoints(arrow, CELL)}
                          pointerEvents="none"
                          className="arrows-ink-fill"
                          style={{
                            fill: ink,
                            opacity: isExiting ? 0 : 1,
                            transform: isExiting ? `translate(${dc * 6}px, ${dr * 6}px)` : undefined,
                            transition: isExiting
                              ? "opacity 0.15s ease, transform 0.45s linear"
                              : undefined,
                          }}
                        />
                        {/* Fat invisible tap target over the same path. */}
                        <path
                          d={d}
                          fill="none"
                          stroke="transparent"
                          strokeWidth={7.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          pointerEvents="stroke"
                          className="cursor-pointer"
                          role="button"
                          tabIndex={0}
                          aria-label={t.arrows.arrowAt(dirName(arrow.headDir), head.row + 1, head.col + 1)}
                          onClick={() => handleTap(arrow.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleTap(arrow.id);
                            }
                          }}
                        >
                          <title>{t.arrows.arrowAt(dirName(arrow.headDir), head.row + 1, head.col + 1)}</title>
                        </path>
                      </g>
                    );
                  })}
                </svg>
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
