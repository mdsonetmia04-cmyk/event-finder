"use client";

/* Bubble Shooter — solo aim-and-match puzzle with glossy 3D balls.
   Drag to aim, release to shoot; match 3+ balls of one colour to pop
   them, and cut hanging clusters loose for double points. The ceiling
   pushes a new row down every few landed shots; if any ball crosses
   the danger line, the level fails. 30 levels in three difficulty
   bands, sequential unlock, stars from score thresholds. Progress
   lives in localStorage only (per-device) — no database table, no
   Supabase calls. The board is a single canvas driven by the headless
   sim in src/lib/bubble-shooter/. */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Lock,
  Pause,
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
import {
  BUBBLE_LEVELS,
  levelDifficulty,
  type BubbleDifficulty,
} from "@/lib/bubble-shooter/levels";
import {
  BubbleShooterController,
  type HudState,
} from "@/lib/bubble-shooter/renderer";
import {
  isSoundEnabled,
  playButtonClick,
  setSoundEnabled,
  unlockAudio,
} from "@/lib/ludo/sounds";

const STARS_KEY = "ssc:bubble-shooter:stars-v1";

type ProgressEntry = { stars: number; best: number };
type ProgressMap = Record<number, ProgressEntry>;
type View = "levels" | "play";
type Phase = "playing" | "won" | "failed";

const DIFFICULTY_DOT: Record<BubbleDifficulty, string> = {
  normal: "#2FA36B",
  hard: "var(--gold-deep)",
  superHard: "#E5484D",
};

function loadProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(STARS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: ProgressMap = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      const n = Number(k);
      if (!Number.isInteger(n) || n < 1 || n > BUBBLE_LEVELS.length) continue;
      if (typeof v !== "object" || v === null) continue;
      const { stars, best } = v as { stars?: unknown; best?: unknown };
      if ((stars === 1 || stars === 2 || stars === 3) && typeof best === "number" && best >= 0) {
        out[n] = { stars: stars as number, best };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function persistProgress(next: ProgressMap): void {
  try {
    window.localStorage.setItem(STARS_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota: progress just won't persist.
  }
}

export default function BubbleShooterPage() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const router = useRouter();

  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [progress, setProgress] = useState<ProgressMap>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [view, setView] = useState<View>("levels");
  const [levelN, setLevelN] = useState(1);
  /** Bumps on every (re)start so the controller effect re-runs even
      for the same level number. */
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<HudState>({ score: 0, comboMult: 1, shotsLeft: 0 });
  const [finalScore, setFinalScore] = useState(0);
  const [earnedStars, setEarnedStars] = useState<1 | 2 | 3>(1);
  const [isNewBest, setIsNewBest] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<BubbleShooterController | null>(null);
  const levelRef = useRef(levelN);
  const progressRef = useRef(progress);
  const pausedRef = useRef(paused);

  useEffect(() => {
    setProgress(loadProgress());
    setProgressLoaded(true);
  }, []);

  useEffect(() => {
    levelRef.current = levelN;
  }, [levelN]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const setPausedBoth = useCallback((p: boolean) => {
    setPaused(p);
    controllerRef.current?.setPaused(p);
  }, []);

  /** P / Escape / tab-hidden all arrive here. The renderer only asks
      from visibilitychange while unpaused, so toggling is safe: a
      second P/Escape resumes, a hidden tab never resumes itself. */
  const handlePauseRequest = useCallback(() => {
    setPausedBoth(!pausedRef.current);
  }, [setPausedBoth]);

  const handleOutcome = useCallback((result: "won" | "failed", score: number, stars: 1 | 2 | 3) => {
    const n = levelRef.current;
    const prev = progressRef.current[n];
    const newBest = score > (prev?.best ?? 0);
    setFinalScore(score);
    setEarnedStars(stars);
    setIsNewBest(newBest && result === "won");
    setProgress((prevMap) => {
      const old = prevMap[n];
      const next = {
        ...prevMap,
        [n]: {
          stars: result === "won" ? Math.max(old?.stars ?? 0, stars) : (old?.stars ?? 0),
          best: Math.max(old?.best ?? 0, score),
        },
      };
      persistProgress(next);
      return next;
    });
    setPhase(result);
  }, []);

  // Controller lifecycle: one controller per run; destroyed when the
  // canvas unmounts (levels view, outcome overlay, or a new run).
  useEffect(() => {
    if (view !== "play" || phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controller = new BubbleShooterController(canvas, {
      level: BUBBLE_LEVELS[levelN - 1],
      reducedMotion: reduced,
      onHud: (h) => setHud(h),
      onOutcome: handleOutcome,
      onPauseRequest: handlePauseRequest,
    });
    controllerRef.current = controller;
    controller.start();
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [view, levelN, runId, phase, handleOutcome, handlePauseRequest]);

  const isUnlocked = useCallback(
    (n: number) => n === 1 || (progress[n - 1]?.stars ?? 0) > 0,
    [progress],
  );

  const startLevel = useCallback((n: number) => {
    setLevelN(n);
    setPhase("playing");
    setPaused(false);
    setHud({ score: 0, comboMult: 1, shotsLeft: BUBBLE_LEVELS[n - 1].pushInterval });
    setIsNewBest(false);
    setRunId((r) => r + 1);
    setView("play");
  }, []);

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
    if (next) playButtonClick();
  }, [soundOn]);

  const difficultyName = useCallback(
    (d: BubbleDifficulty) =>
      d === "normal" ? t.bubbles.difficultyNormal : d === "hard" ? t.bubbles.difficultyHard : t.bubbles.difficultySuperHard,
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

  const totalStars = Object.values(progress).reduce((a, b) => a + b.stars, 0);
  const level = BUBBLE_LEVELS[levelN - 1];
  const difficulty = levelDifficulty(levelN);
  const isLastLevel = levelN >= BUBBLE_LEVELS.length;
  const bestForLevel = progress[levelN]?.best ?? 0;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <SectionHeader
        title={t.bubbles.title}
        subtitle={t.bubbles.tagline}
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
              {t.bubbles.howTo}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
              <Star size={16} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              {t.bubbles.starsLabel}: {progressLoaded ? totalStars : 0} / {BUBBLE_LEVELS.length * 3}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {t.bubbles.progressNote}
            </p>
          </div>

          <h2 className="font-serif-d text-lg font-semibold">{t.bubbles.levelSelect}</h2>
          <div className="grid grid-cols-5 gap-2" role="group" aria-label={t.bubbles.levelSelect}>
            {BUBBLE_LEVELS.map((lv) => {
              const unlocked = isUnlocked(lv.n);
              const earned = progress[lv.n]?.stars ?? 0;
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
                      ? `${t.bubbles.level(lv.n)} — ${difficultyName(lvDifficulty)} — ${earned}/3 ${t.bubbles.starsLabel}`
                      : `${t.bubbles.level(lv.n)} — ${t.bubbles.locked}`
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
          {/* HUD: back, level title, score / combo / push countdown / difficulty. */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                playButtonClick();
                setPaused(false);
                setView("levels");
              }}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              {t.bubbles.backToLevels}
            </button>
            <h2 className="font-serif-d text-lg font-semibold">{t.bubbles.level(levelN)}</h2>
            <span className="w-10 shrink-0" aria-hidden="true" />
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2"
            style={{ background: "var(--surface2)" }}
          >
            <span className="text-sm font-semibold">
              {t.bubbles.score}: {hud.score}
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: hud.comboMult > 1 ? "var(--gold-deep)" : undefined }}
            >
              {t.bubbles.combo} ×{hud.comboMult.toFixed(1)}
            </span>
            <span className="text-sm font-semibold">
              {t.bubbles.shotsToPush}: {hud.shotsLeft}/{level.pushInterval}
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
          {bestForLevel > 0 && (
            <p className="-mt-2 text-right text-xs" style={{ color: "var(--muted)" }}>
              {t.bubbles.bestScore}: {bestForLevel}
            </p>
          )}

          {phase === "playing" ? (
            <>
              {/* Padding-free wrapper: the controller sizes the canvas
                  from its parent element's width. */}
              <div
                className="mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="block h-auto w-full touch-none select-none"
                    style={{ touchAction: "none" }}
                    role="img"
                    aria-label={t.bubbles.boardLabel}
                  />
                  {paused && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4"
                      style={{ background: "rgba(10, 8, 6, 0.62)" }}
                    >
                      <p className="font-serif-d text-2xl font-semibold text-white">{t.bubbles.paused}</p>
                      <button
                        type="button"
                        className="btn btn-gold"
                        onClick={() => {
                          playButtonClick();
                          setPausedBoth(false);
                        }}
                      >
                        <Play size={17} aria-hidden="true" />
                        {t.bubbles.resume}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ color: "#fff" }}
                        onClick={() => {
                          playButtonClick();
                          setPaused(false);
                          setView("levels");
                        }}
                      >
                        {t.bubbles.backToLevels}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  disabled={paused}
                  onClick={() => {
                    unlockAudio();
                    controllerRef.current?.swap();
                  }}
                >
                  <ArrowLeftRight size={16} aria-hidden="true" />
                  {t.bubbles.swap}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  disabled={paused}
                  onClick={() => {
                    playButtonClick();
                    setPausedBoth(true);
                  }}
                >
                  <Pause size={16} aria-hidden="true" />
                  {t.bubbles.pause}
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
                  {t.bubbles.replay}
                </button>
              </div>
              <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
                {t.bubbles.aimHint}
              </p>
            </>
          ) : phase === "won" ? (
            <div className="card p-5 text-center sm:p-6">
              <Trophy size={32} className="mx-auto" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
              <h2 className="font-serif-d mt-2 text-2xl font-semibold">{t.bubbles.winTitle}</h2>
              <p className="mt-2 flex items-center justify-center gap-1" aria-label={`${earnedStars}/3 ${t.bubbles.starsLabel}`}>
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    size={30}
                    style={{ color: s <= earnedStars ? "var(--gold-deep)" : "var(--line)" }}
                    fill={s <= earnedStars ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                ))}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {t.bubbles.winSub(finalScore)}
              </p>
              {isNewBest && (
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>
                  {t.bubbles.newBest}
                </p>
              )}
              {isLastLevel && (
                <p className="mt-1 text-sm font-semibold" style={{ color: "var(--gold-deep)" }}>
                  {t.bubbles.allCleared}
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
                    {t.bubbles.nextLevel}
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
                  {t.bubbles.replay}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => {
                    playButtonClick();
                    setView("levels");
                  }}
                >
                  {t.bubbles.backToLevels}
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-5 text-center sm:p-6">
              <h2 className="font-serif-d mt-2 text-2xl font-semibold">{t.bubbles.failTitle}</h2>
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {t.bubbles.failSub}
              </p>
              <p className="mt-2 text-sm font-semibold">
                {t.bubbles.score}: {finalScore}
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
                  {t.bubbles.retry}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost flex-1"
                  onClick={() => {
                    playButtonClick();
                    setView("levels");
                  }}
                >
                  {t.bubbles.backToLevels}
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
