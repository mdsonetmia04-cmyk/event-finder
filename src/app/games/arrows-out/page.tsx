"use client";

/* Arrows Out — solo logic puzzle, video-style rebuild. Each arrow is
   a winding line with an arrowhead; tap one to send it flying
   straight out of the board in its head direction, but only when its
   way out (the straight lane from its head to the edge) is clear. A
   blocked arrow just shakes — no lives, no fail state. 30 levels in
   three difficulty bands, sequential unlock, stars for power-up use
   (3 = none used, 2 = one used, 1 = more). Shaped boards: heart at
   L6, circle "HARD LEVEL" at L10, diamond at L24. Power-ups: Hint
   (green highlight), Eraser (remove any arrow), Grid Scale (blue
   guide lines). Progress + power-up counts + coin totals live in
   localStorage only (per-device) — no database table, no Supabase
   calls. */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Circle,
  Coins,
  Diamond,
  Eraser,
  Heart,
  Lightbulb,
  Lock,
  PiggyBank,
  Play,
  RotateCcw,
  Ruler,
  Settings,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { SectionHeader } from "@/components/ui";
import { ARROWS_LEVELS, levelArrows, levelDifficulty, type ArrowsDifficulty, type ArrowsLevel } from "@/lib/arrows-out/levels";
import {
  arrowPathD,
  arrowheadPoints,
  DIRECTION_DELTAS,
  findRemovableArrow,
  headCell,
  headLaneClear,
  shapeMask,
  type Direction,
  type MazeArrow,
} from "@/lib/arrows-out/solver";
import {
  COINS_PER_WIN,
  isEraserUnlocked,
  isGridUnlocked,
  loadPowerups,
  loadRewards,
  PIGGY_PER_WIN,
  savePowerups,
  saveRewards,
  type PowerupCounts,
  type RewardTotals,
} from "@/lib/arrows-out/powerups";
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
import { ADOBE_STOCK_NUDGE, NUDGE_AFTER_WINS, pickPostMatchLine, recordWin } from "@/lib/games/win-motivation";

const EXIT_MS = 480;
const BUMP_MS = 350;
const ERASE_MS = 300;
const HINT_GLOW_MS = 2000;
const NOTE_MS = 3000;
/** v2 key: the maze rebuild must not inherit grid-version progress. */
const STARS_KEY = "ssc:arrows-out:stars-v2";
/** ViewBox units per grid cell. */
const CELL = 10;
/** Hint highlight colour (video-style safe-exit green). */
const HINT_GREEN = "#2FA36B";
/** Grid Scale guide-line colour. */
const GRID_BLUE = "#2FA8FF";

type StarsMap = Record<number, number>;
type View = "levels" | "play";
type Phase = "playing" | "won";

const DIFFICULTY_DOT: Record<ArrowsDifficulty, string> = {
  normal: "#2FA36B",
  hard: "var(--gold-deep)",
  superHard: "#E5484D",
};

const CONFETTI_COLORS = ["#F5C518", "#E5484D", "#2FA36B", "#2FA8FF", "#B166FF"];

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

/** Stars earned for an attempt: 3 = no power-up used, 2 = one used,
    1 = two or more used. The grid toggle never costs a star. */
function starsForAttempt(powerupsUsed: number): number {
  if (powerupsUsed <= 0) return 3;
  if (powerupsUsed === 1) return 2;
  return 1;
}

export default function ArrowsOutPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [stars, setStars] = useState<StarsMap>({});
  const [powerups, setPowerups] = useState<PowerupCounts>({ hints: 1, erasers: 0 });
  const [rewards, setRewards] = useState<RewardTotals>({ coins: 0, piggy: 0 });
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [view, setView] = useState<View>("levels");
  const [levelN, setLevelN] = useState(1);
  const [arrows, setArrows] = useState<MazeArrow[]>(() => levelArrows(ARROWS_LEVELS[0]));
  const [removed, setRemoved] = useState<ReadonlySet<number>>(new Set());
  const [moves, setMoves] = useState(0);
  /** Power-ups used in this attempt (hint + eraser only). */
  const [powerupsUsed, setPowerupsUsed] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [exitingId, setExitingId] = useState<number | null>(null);
  const [erasingId, setErasingId] = useState<number | null>(null);
  const [bumping, setBumping] = useState<{ id: number; key: number } | null>(null);
  const [hintId, setHintId] = useState<number | null>(null);
  const [eraserArmed, setEraserArmed] = useState(false);
  const [gridOn, setGridOn] = useState(false);
  const [toolNote, setToolNote] = useState<string | null>(null);
  /** Loss-pool line shown after quitting a level mid-way. */
  const [abandonNote, setAbandonNote] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Adobe Stock nudge: shown from the 3rd session win onward. */
  const [showNudge, setShowNudge] = useState(false);

  const starsRef = useRef<StarsMap>({});
  const removedRef = useRef<ReadonlySet<number>>(new Set());
  const timersRef = useRef<number[]>([]);
  const bumpKeyRef = useRef(0);
  /** Bumps on every startLevel so each attempt is a distinct win. */
  const attemptRef = useRef(0);

  useEffect(() => {
    setStars(loadStars());
    starsRef.current = loadStars();
    setPowerups(loadPowerups());
    setRewards(loadRewards());
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

  const level: ArrowsLevel = ARROWS_LEVELS[levelN - 1];
  const size = level.size;
  const difficulty = levelDifficulty(levelN);
  const gridUnlocked = isGridUnlocked(stars);
  const eraserUnlocked = isEraserUnlocked(stars);

  const startLevel = useCallback(
    (n: number) => {
      clearTimers();
      attemptRef.current += 1;
      setLevelN(n);
      setArrows(levelArrows(ARROWS_LEVELS[n - 1]));
      removedRef.current = new Set();
      setRemoved(new Set());
      setMoves(0);
      setPowerupsUsed(0);
      setPhase("playing");
      setExitingId(null);
      setErasingId(null);
      setBumping(null);
      setHintId(null);
      setEraserArmed(false);
      setToolNote(null);
      setAbandonNote(null);
      setSettingsOpen(false);
      setView("play");
    },
    [clearTimers],
  );

  /** Leave the play view. Quitting mid-level (after at least one
      move) is an abandoned match: show one loss-pool line on the
      levels screen. */
  const quitLevel = useCallback(() => {
    clearTimers();
    setExitingId(null);
    setErasingId(null);
    setBumping(null);
    setHintId(null);
    setEraserArmed(false);
    setSettingsOpen(false);
    setView("levels");
    if (phase === "playing" && moves > 0) {
      setAbandonNote(pickPostMatchLine("loss", `arrows-out:${levelN}:${attemptRef.current}`));
    }
  }, [clearTimers, levelN, moves, phase]);

  const saveStars = useCallback((n: number, earned: number) => {
    const prev = starsRef.current;
    const best = Math.max(prev[n] ?? 0, earned);
    const next = { ...prev, [n]: best };
    starsRef.current = next;
    try {
      window.localStorage.setItem(STARS_KEY, JSON.stringify(next));
    } catch {
      // Private mode / quota: progress just won't persist.
    }
    setStars(next);
    return { firstTime: (prev[n] ?? 0) === 0, next };
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playButtonClick();
  }, [soundOn]);

  /** Shared win path: stars by power-up use, +5 coins / +100 piggy,
      +1 hint (and +1 eraser once unlocked) on a first-time
      completion, win counting + nudge. */
  const completeLevel = useCallback(() => {
    setPhase("won");
    playWinFanfare();
    const earned = starsForAttempt(powerupsUsed);
    const { firstTime, next } = saveStars(levelN, earned);
    setRewards((prev) => {
      const totals = { coins: prev.coins + COINS_PER_WIN, piggy: prev.piggy + PIGGY_PER_WIN };
      saveRewards(totals);
      return totals;
    });
    if (firstTime) {
      setPowerups((prev) => {
        const counts = { hints: prev.hints + 1, erasers: prev.erasers + (isEraserUnlocked(next) ? 1 : 0) };
        savePowerups(counts);
        return counts;
      });
    }
    /* Count-once win identity: level + attempt. */
    const { count } = recordWin("arrows-out", `arrows-out:${levelN}:${attemptRef.current}`);
    setShowNudge(count >= NUDGE_AFTER_WINS);
  }, [levelN, powerupsUsed, saveStars]);

  const handleTap = useCallback(
    (id: number) => {
      if (phase !== "playing" || exitingId !== null || erasingId !== null || bumping) return;
      if (removedRef.current.has(id)) return;
      unlockAudio();
      if (eraserArmed) {
        if (powerups.erasers <= 0) {
          setToolNote(t.arrows.noErasers);
          later(() => setToolNote(null), NOTE_MS);
          setEraserArmed(false);
          return;
        }
        playTokenPop();
        setErasingId(id);
        setEraserArmed(false);
        setMoves((m) => m + 1);
        setPowerupsUsed((u) => u + 1);
        setHintId(null);
        setPowerups((prev) => {
          const counts = { ...prev, erasers: prev.erasers - 1 };
          savePowerups(counts);
          return counts;
        });
        later(() => {
          const next = new Set(removedRef.current);
          next.add(id);
          removedRef.current = next;
          setRemoved(next);
          setErasingId(null);
          if (next.size === arrows.length) completeLevel();
        }, ERASE_MS);
        return;
      }
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
          if (next.size === arrows.length) completeLevel();
        }, EXIT_MS);
      } else {
        playCapture();
        bumpKeyRef.current += 1;
        setBumping({ id, key: bumpKeyRef.current });
        later(() => setBumping(null), BUMP_MS);
      }
    },
    [arrows, bumping, completeLevel, eraserArmed, erasingId, exitingId, later, phase, powerups.erasers, size, t.arrows.noErasers],
  );

  const useHint = useCallback(() => {
    if (phase !== "playing" || exitingId !== null || erasingId !== null || bumping) return;
    unlockAudio();
    if (powerups.hints <= 0) {
      setToolNote(t.arrows.noHints);
      later(() => setToolNote(null), NOTE_MS);
      return;
    }
    const found = findRemovableArrow(arrows, size, removedRef.current);
    if (found === null) {
      setToolNote(t.arrows.noHints);
      later(() => setToolNote(null), NOTE_MS);
      return;
    }
    playTurnChime();
    setPowerups((prev) => {
      const counts = { ...prev, hints: prev.hints - 1 };
      savePowerups(counts);
      return counts;
    });
    setPowerupsUsed((u) => u + 1);
    setEraserArmed(false);
    setHintId(found);
    later(() => setHintId(null), HINT_GLOW_MS);
  }, [arrows, bumping, erasingId, exitingId, later, phase, powerups.hints, size, t.arrows.noHints]);

  const toggleEraser = useCallback(() => {
    if (phase !== "playing" || exitingId !== null || erasingId !== null || bumping) return;
    unlockAudio();
    if (!eraserUnlocked) {
      setToolNote(t.arrows.eraserLocked);
      later(() => setToolNote(null), NOTE_MS);
      return;
    }
    if (powerups.erasers <= 0) {
      setToolNote(t.arrows.noErasers);
      later(() => setToolNote(null), NOTE_MS);
      return;
    }
    setEraserArmed((a) => !a);
    setHintId(null);
  }, [bumping, eraserUnlocked, erasingId, exitingId, later, phase, powerups.erasers, t.arrows.eraserLocked, t.arrows.noErasers]);

  const toggleGrid = useCallback(() => {
    if (phase !== "playing") return;
    unlockAudio();
    if (!gridUnlocked) {
      setToolNote(t.arrows.gridLocked);
      later(() => setToolNote(null), NOTE_MS);
      return;
    }
    playButtonClick();
    setGridOn((g) => !g);
  }, [gridUnlocked, later, phase, t.arrows.gridLocked]);

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
  const isLastLevel = levelN >= ARROWS_LEVELS.length;
  const viewSpan = size * CELL + 12;
  const mask = level.shape ? shapeMask(size, level.shape) : null;
  const earnedStars = stars[levelN] ?? 0;

  /* Shape outline geometry in viewBox units (for the outline stroke
     and the clip that keeps dots + grid lines inside the shape). */
  const shapeOutline =
    level.shape === "circle" ? (
      <circle cx={size * CELL / 2} cy={size * CELL / 2} r={size * CELL / 2 - 4} fill="none" stroke="var(--line)" strokeWidth={1.2} opacity={0.8} pointerEvents="none" />
    ) : level.shape === "diamond" ? (
      <polygon
        points={`${size * CELL / 2},0 ${size * CELL},${size * CELL / 2} ${size * CELL / 2},${size * CELL} 0,${size * CELL / 2}`}
        fill="none"
        stroke="var(--line)"
        strokeWidth={1.2}
        opacity={0.8}
        pointerEvents="none"
      />
    ) : level.shape === "heart" ? (
      <path
        d="M50 86 C50 86 10 60 10 34 C10 20 22 10 34 10 C42 10 48 16 50 22 C52 16 58 10 66 10 C78 10 90 20 90 34 C90 60 50 86 50 86 Z"
        fill="none"
        stroke="var(--line)"
        strokeWidth={1.2}
        opacity={0.8}
        pointerEvents="none"
      />
    ) : null;
  const shapeClip =
    level.shape === "circle" ? (
      <circle cx={size * CELL / 2} cy={size * CELL / 2} r={size * CELL / 2 - 4} />
    ) : level.shape === "diamond" ? (
      <polygon points={`${size * CELL / 2},0 ${size * CELL},${size * CELL / 2} ${size * CELL / 2},${size * CELL} 0,${size * CELL / 2}`} />
    ) : level.shape === "heart" ? (
      <path d="M50 86 C50 86 10 60 10 34 C10 20 22 10 34 10 C42 10 48 16 50 22 C52 16 58 10 66 10 C78 10 90 20 90 34 C90 60 50 86 50 86 Z" />
    ) : null;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <SectionHeader title={t.arrows.title} subtitle={t.arrows.tagline} />

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
            <p className="mt-1 flex items-center gap-3 text-sm font-semibold">
              <span className="flex items-center gap-1">
                <Coins size={16} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
                {progressLoaded ? rewards.coins : 0}
              </span>
              <span className="flex items-center gap-1">
                <PiggyBank size={16} style={{ color: "#E87EA1" }} aria-hidden="true" />
                {progressLoaded ? rewards.piggy : 0}
              </span>
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {t.arrows.progressNote}
            </p>
          </div>

          {abandonNote && (
            <div
              className="flex items-start justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
              style={{ background: "var(--surface2)", color: "var(--gold-deep)" }}
              role="status"
            >
              <span>{abandonNote}</span>
              <button
                type="button"
                onClick={() => setAbandonNote(null)}
                aria-label={t.arrows.dismiss}
                className="shrink-0 rounded-full p-0.5"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          <h2 className="font-serif-d text-lg font-semibold">{t.arrows.levelSelect}</h2>
          <div className="grid grid-cols-5 gap-2" role="group" aria-label={t.arrows.levelSelect}>
            {ARROWS_LEVELS.map((lv) => {
              const unlocked = isUnlocked(lv.n);
              const earned = stars[lv.n] ?? 0;
              const lvDifficulty = levelDifficulty(lv.n);
              const shapeIcon =
                lv.shape === "heart" ? (
                  <Heart size={11} style={{ color: "#E5484D" }} fill="currentColor" aria-hidden="true" />
                ) : lv.shape === "circle" ? (
                  <Circle size={11} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
                ) : lv.shape === "diamond" ? (
                  <Diamond size={11} style={{ color: "#2FA8FF" }} aria-hidden="true" />
                ) : null;
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
                      <span className="flex h-[11px] items-center gap-1" aria-hidden="true">
                        {shapeIcon}
                        <span
                          className="h-[6px] w-[6px] rounded-full"
                          style={{ background: DIFFICULTY_DOT[lvDifficulty] }}
                          title={difficultyName(lvDifficulty)}
                        />
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
          {/* Video-style top bar: back, LEVEL N, 3 stars, sound, settings. */}
          {levelN === 10 && (
            <p className="text-center">
              <span
                className="inline-block rounded-full px-3 py-0.5 text-xs font-bold tracking-wide"
                style={{ background: "#E5484D", color: "#fff" }}
              >
                {t.arrows.hardLevel}
              </span>
            </p>
          )}
          <div
            className="relative flex items-center justify-between gap-2 rounded-full px-3 py-2"
            style={{ background: "var(--surface2)" }}
          >
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  playButtonClick();
                  quitLevel();
                }}
                aria-label={t.arrows.backToLevels}
                className="rounded-full p-1"
              >
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
              <span className="text-sm font-bold tracking-wide" style={{ color: "var(--muted)" }}>
                {t.arrows.level(levelN).toUpperCase()}
              </span>
            </span>
            <span className="flex gap-0.5" aria-label={`${earnedStars}/3 ${t.arrows.starsLabel}`}>
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  size={18}
                  style={{ color: "var(--gold-deep)" }}
                  fill="currentColor"
                  aria-hidden="true"
                />
              ))}
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSound}
                aria-label={soundOn ? t.ludo.soundOff : t.ludo.soundOn}
                aria-pressed={soundOn}
                className="rounded-full p-1"
              >
                {soundOn ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen((o) => !o)}
                aria-label={t.arrows.settings}
                aria-expanded={settingsOpen}
                className="rounded-full p-1"
              >
                <Settings size={16} aria-hidden="true" />
              </button>
            </span>
            {settingsOpen && (
              <>
                <button
                  type="button"
                  aria-label={t.arrows.dismiss}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setSettingsOpen(false)}
                />
                <div
                  className="absolute right-2 top-full z-20 mt-1 flex w-44 flex-col overflow-hidden rounded-xl border"
                  style={{ background: "var(--card)", borderColor: "var(--line)" }}
                  role="menu"
                >
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 text-left text-sm font-medium"
                    onClick={() => {
                      toggleSound();
                      setSettingsOpen(false);
                    }}
                    role="menuitem"
                  >
                    {soundOn ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
                    {soundOn ? t.ludo.soundOn : t.ludo.soundOff}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 text-left text-sm font-medium"
                    onClick={() => {
                      playButtonClick();
                      setSettingsOpen(false);
                      startLevel(levelN);
                    }}
                    role="menuitem"
                  >
                    <RotateCcw size={15} aria-hidden="true" />
                    {t.arrows.restart}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 text-left text-sm font-medium"
                    onClick={() => {
                      playButtonClick();
                      quitLevel();
                    }}
                    role="menuitem"
                  >
                    <ArrowLeft size={15} aria-hidden="true" />
                    {t.arrows.backToLevels}
                  </button>
                </div>
              </>
            )}
          </div>

          {phase === "playing" ? (
            <>
              {moves === 0 && (
                <p className="text-center text-sm font-medium" style={{ color: "var(--muted)" }}>
                  {t.arrows.tapToExit}
                </p>
              )}
              {eraserArmed && (
                <p className="text-center text-sm font-semibold" style={{ color: "#E5484D" }}>
                  {t.arrows.eraserArmed}
                </p>
              )}
              <div
                className="arrows-board mx-auto w-full max-w-[480px] rounded-2xl border p-2 sm:p-3"
                style={{ borderColor: "var(--line)" }}
              >
                <svg
                  viewBox={`-6 -6 ${viewSpan} ${viewSpan}`}
                  className="block h-auto w-full"
                  role="group"
                  aria-label={t.arrows.boardLabel}
                >
                  {level.shape && (
                    <defs>
                      <clipPath id="arrows-shape-clip">{shapeClip}</clipPath>
                    </defs>
                  )}
                  {/* Dotted grid: one dot per playable cell centre. */}
                  <g clipPath={level.shape ? "url(#arrows-shape-clip)" : undefined}>
                    {Array.from({ length: size }, (_, r) =>
                      Array.from({ length: size }, (_, c) => {
                        if (mask && !mask[r][c]) return null;
                        return (
                          <circle
                            key={`${r}-${c}`}
                            cx={c * CELL + CELL / 2}
                            cy={r * CELL + CELL / 2}
                            r={0.9}
                            fill="var(--line)"
                            opacity={0.6}
                            pointerEvents="none"
                          />
                        );
                      }),
                    )}
                    {/* Grid Scale guide lines (blue, only when toggled on). */}
                    {gridOn &&
                      Array.from({ length: size + 1 }, (_, i) => (
                        <g key={`grid-${i}`} stroke={GRID_BLUE} strokeWidth={0.5} opacity={0.45} pointerEvents="none">
                          <line x1={i * CELL} y1={0} x2={i * CELL} y2={size * CELL} />
                          <line x1={0} y1={i * CELL} x2={size * CELL} y2={i * CELL} />
                        </g>
                      ))}
                  </g>
                  {shapeOutline}
                  {/* Exiting / erasing arrows paint last so they fly over the rest. */}
                  {[...arrows]
                    .sort((a, b) => Number(a.id === exitingId || a.id === erasingId) - Number(b.id === exitingId || b.id === erasingId))
                    .map((arrow) => {
                      if (removed.has(arrow.id)) return null;
                      const isExiting = exitingId === arrow.id;
                      const isErasing = erasingId === arrow.id;
                      const isBumping = bumping?.id === arrow.id;
                      const isHint = hintId === arrow.id;
                      const d = arrowPathD(arrow, CELL);
                      const head = headCell(arrow);
                      const { dr, dc } = DIRECTION_DELTAS[arrow.headDir];
                      const ink = isBumping ? "#E5484D" : isHint ? HINT_GREEN : undefined;
                      return (
                        <g
                          key={arrow.id}
                          className={
                            isExiting
                              ? "arrows-maze-exit"
                              : isErasing
                                ? "arrows-maze-erase"
                                : isBumping
                                  ? "arrows-maze-shake"
                                  : isHint
                                    ? "arrows-maze-hint"
                                    : undefined
                          }
                          style={
                            isExiting
                              ? ({
                                  /* Fly-out direction/distance for the
                                     arrows-maze-exit keyframes: straight out
                                     of the board in the head direction. The
                                     travel distance clears the whole viewport
                                     from any position. */
                                  "--exit-dx": `${dc * (viewSpan + 24)}px`,
                                  "--exit-dy": `${dr * (viewSpan + 24)}px`,
                                } as CSSProperties)
                              : undefined
                          }
                        >
                          {/* Visible winding line. */}
                          <path
                            d={d}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            pointerEvents="none"
                            className="arrows-ink"
                            style={{
                              stroke: ink,
                              strokeWidth: isHint ? 3 : 2.2,
                            }}
                          />
                          {/* Arrowhead: travels with the group. */}
                          <polygon
                            points={arrowheadPoints(arrow, CELL)}
                            pointerEvents="none"
                            className="arrows-ink-fill"
                            style={{ fill: ink }}
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
                            className="arrows-tap cursor-pointer"
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

              {/* Bottom toolbar: Hint, Eraser, Grid Scale (video-style). */}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-2 py-2"
                  style={{ background: "var(--card)", borderColor: "var(--line)" }}
                  onClick={useHint}
                  aria-label={`${t.arrows.hintButton} (${powerups.hints})`}
                >
                  <Lightbulb size={20} style={{ color: powerups.hints > 0 ? "#F5C518" : "var(--muted)" }} aria-hidden="true" />
                  <span className="text-xs font-semibold">{t.arrows.hints}</span>
                  {powerups.hints > 0 && (
                    <span
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: "#2FA36B" }}
                      aria-hidden="true"
                    >
                      {powerups.hints}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-2 py-2"
                  style={{
                    background: "var(--card)",
                    borderColor: eraserArmed ? "#E5484D" : "var(--line)",
                    boxShadow: eraserArmed ? "0 0 0 2px rgba(229,72,77,0.25)" : undefined,
                  }}
                  onClick={toggleEraser}
                  aria-label={`${t.arrows.eraser} (${powerups.erasers})`}
                  aria-pressed={eraserArmed}
                >
                  <Eraser size={20} style={{ color: eraserArmed ? "#E5484D" : eraserUnlocked ? "#E87EA1" : "var(--muted)" }} aria-hidden="true" />
                  <span className="text-xs font-semibold">{t.arrows.eraser}</span>
                  {!eraserUnlocked ? (
                    <span
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
                      style={{ background: "var(--muted)" }}
                      aria-hidden="true"
                    >
                      <Lock size={11} />
                    </span>
                  ) : (
                    powerups.erasers > 0 && (
                      <span
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: "#2FA36B" }}
                        aria-hidden="true"
                      >
                        {powerups.erasers}
                      </span>
                    )
                  )}
                </button>
                <button
                  type="button"
                  className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-2 py-2"
                  style={{
                    background: "var(--card)",
                    borderColor: gridOn ? GRID_BLUE : "var(--line)",
                    boxShadow: gridOn ? "0 0 0 2px rgba(47,168,255,0.25)" : undefined,
                  }}
                  onClick={toggleGrid}
                  aria-label={t.arrows.gridScale}
                  aria-pressed={gridOn}
                >
                  <Ruler size={20} style={{ color: gridOn ? GRID_BLUE : gridUnlocked ? "#2FA8FF" : "var(--muted)" }} aria-hidden="true" />
                  <span className="text-xs font-semibold">{t.arrows.gridScale}</span>
                  {!gridUnlocked && (
                    <span
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-white"
                      style={{ background: "var(--muted)" }}
                      aria-hidden="true"
                    >
                      <Lock size={11} />
                    </span>
                  )}
                </button>
              </div>
              <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
                {t.arrows.starCostNote}
              </p>
              {toolNote && (
                <p role="status" className="text-center text-sm font-medium" style={{ color: "var(--gold-deep)" }}>
                  {toolNote}
                </p>
              )}
            </>
          ) : (
            /* Level complete — video-style celebration: dark card,
               confetti, 3 stars, LEVEL N COMPLETED!, coins +5 and
               piggy +100, NEXT button. */
            <div
              className="relative overflow-hidden rounded-2xl p-5 text-center sm:p-6"
              style={{ background: "#151311", color: "#FBF7F0" }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                {Array.from({ length: 24 }, (_, i) => (
                  <span
                    key={i}
                    className="ludo-confetti-piece absolute block"
                    style={{
                      left: `${(i * 37 + 5) % 100}%`,
                      top: 0,
                      width: 6 + (i % 3) * 2,
                      height: 6 + (i % 3) * 2,
                      background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                      animationDuration: `${2.2 + (i % 5) * 0.35}s`,
                      animationDelay: `${(i % 7) * 0.18}s`,
                    }}
                  />
                ))}
              </div>
              <p className="relative flex items-center justify-center gap-1" aria-label={`${starsForAttempt(powerupsUsed)}/3 ${t.arrows.starsLabel}`}>
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={34}
                    style={{ color: s <= starsForAttempt(powerupsUsed) ? "#F5C518" : "#4a443c" }}
                    fill="currentColor"
                    aria-hidden="true"
                  />
                ))}
              </p>
              <h2 className="font-serif-d relative mt-2 text-2xl font-semibold">{t.arrows.levelCompleted(levelN)}</h2>
              <p className="relative mt-2 text-base font-bold" style={{ color: "#D9A044" }}>
                {pickPostMatchLine("win", `arrows-out:${levelN}:${attemptRef.current}`)}
              </p>
              <div
                className="relative mx-auto mt-4 flex max-w-[280px] items-center justify-center gap-6 rounded-2xl border px-4 py-3"
                style={{ borderColor: "#D9A044" }}
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <Coins size={22} style={{ color: "#F5C518" }} aria-hidden="true" />
                  +{COINS_PER_WIN}
                  <span className="text-xs font-medium opacity-70">{t.arrows.coins}</span>
                </span>
                <span className="flex items-center gap-1.5 font-bold">
                  <PiggyBank size={22} style={{ color: "#E87EA1" }} aria-hidden="true" />
                  +{PIGGY_PER_WIN}
                  <span className="text-xs font-medium opacity-70">{t.arrows.piggyBank}</span>
                </span>
              </div>
              <p className="relative mt-3 text-sm opacity-80">{t.arrows.winSub(moves)}</p>
              {showNudge && (
                <p
                  className="relative mx-auto mt-3 max-w-[420px] rounded-xl px-3 py-2 text-sm font-semibold"
                  style={{ background: "rgba(217,160,68,0.18)", color: "#D9A044" }}
                >
                  {ADOBE_STOCK_NUDGE}
                </p>
              )}
              {isLastLevel && (
                <p className="relative mt-1 text-sm font-semibold" style={{ color: "#D9A044" }}>
                  {t.arrows.allCleared}
                </p>
              )}
              <div className="relative mt-5 flex flex-col gap-2 sm:flex-row">
                {!isLastLevel && (
                  <button
                    type="button"
                    className="btn flex-1"
                    style={{ background: "#2FA36B", color: "#fff" }}
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
                  style={{ color: "#FBF7F0" }}
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
                  style={{ color: "#FBF7F0" }}
                  onClick={() => {
                    playButtonClick();
                    quitLevel();
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
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            playButtonClick();
            if (view === "play") quitLevel();
            else router.push("/games");
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {view === "play" ? t.arrows.backToLevels : t.games.backToZone}
        </button>
      </div>
    </div>
  );
}
