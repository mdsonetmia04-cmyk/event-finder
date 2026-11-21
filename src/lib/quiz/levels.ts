/* Quiz Battle — Levels mode.
   50 levels x 30 questions (1,500 total), all about the Adobe Stock
   contributor rules. Scoring is marks, not points: the player earns 1
   mark per correct answer; Sweet AI earns 1 mark whenever the player
   answers wrong or times out.
   UNLOCK (per band — user rule 2026-11-21): a level is CLEARED when
   correct >= its band threshold, and only a cleared level unlocks the
   next one: Basic (1–5) 15+, Intermediate (6–15) 20+, Advanced
   (16–30) 22+, Expert (31–45) 25+, Master (46–50) 30/30.
   Stars (unchanged): 26–30 correct = 3 stars, 21–25 = 2 stars,
   16–20 = 1 star — so a Basic clear at 15 correct earns 0 stars.
   The User-vs-AI marks are the scoreboard, not the unlock rule.
   Progress (highest unlocked level + stars/best per level) persists in
   localStorage under LEVELS_STORAGE_KEY. */

import type { BattleQuestion, QuizQuestion } from "./adobe-stock-questions";
import { LEVELS_BASIC } from "./levels-basic";
import { LEVELS_INTERMEDIATE } from "./levels-intermediate";
import { LEVELS_ADVANCED_A } from "./levels-advanced-a";
import { LEVELS_ADVANCED_B } from "./levels-advanced-b";
import { LEVELS_EXPERT_A } from "./levels-expert-a";
import { LEVELS_EXPERT_B } from "./levels-expert-b";
import { LEVELS_MASTER } from "./levels-master";

export const LEVELS_COUNT = 50;
export const QUESTIONS_PER_LEVEL = 30;
export const LEVEL_QUESTION_MS = 15000;
export const LEVELS_STORAGE_KEY = "ssc:quiz-battle:levels-v1";

export interface LevelBand {
  name: string;
  nameBn: string;
  from: number;
  to: number;
  /** Correct answers needed to clear a level in this band (0..30). */
  threshold: number;
}

export const LEVEL_BANDS: LevelBand[] = [
  { name: "Basic", nameBn: "বেসিক", from: 1, to: 5, threshold: 15 },
  { name: "Intermediate", nameBn: "ইন্টারমিডিয়েট", from: 6, to: 15, threshold: 20 },
  { name: "Advanced", nameBn: "অ্যাডভান্সড", from: 16, to: 30, threshold: 22 },
  { name: "Expert", nameBn: "এক্সপার্ট", from: 31, to: 45, threshold: 25 },
  { name: "Master", nameBn: "মাস্টার", from: 46, to: 50, threshold: 30 },
];

export function bandForLevel(level: number): LevelBand {
  return LEVEL_BANDS.find((b) => level >= b.from && level <= b.to) ?? LEVEL_BANDS[0];
}

/** Correct answers needed to clear a level (unlock the next one). */
export function unlockThresholdForLevel(level: number): number {
  return bandForLevel(level).threshold;
}

/** A level is cleared when correct >= its band threshold. */
export function isLevelCleared(level: number, correct: number): boolean {
  return correct >= unlockThresholdForLevel(level);
}

/**
 * Bot display accuracy per band. Cosmetic only: it drives the bot's shown
 * pick (and its ✓/✗), while SCORING follows the level rule — the bot
 * earns 1 mark exactly when the player answers wrong or times out.
 */
export function botAccuracyForLevel(level: number): number {
  if (level <= 5) return 0.55;
  if (level <= 15) return 0.65;
  if (level <= 30) return 0.75;
  if (level <= 45) return 0.85;
  return 0.9;
}

export const ALL_LEVEL_QUESTIONS: Record<number, QuizQuestion[]> = {
  ...LEVELS_BASIC,
  ...LEVELS_INTERMEDIATE,
  ...LEVELS_ADVANCED_A,
  ...LEVELS_ADVANCED_B,
  ...LEVELS_EXPERT_A,
  ...LEVELS_EXPERT_B,
  ...LEVELS_MASTER,
};

export function getLevelQuestions(level: number): QuizQuestion[] {
  return ALL_LEVEL_QUESTIONS[level] ?? [];
}

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Draw a level's 30 questions in random order, each with shuffled options. */
export function drawLevelQuestions(level: number): BattleQuestion[] {
  return shuffled(getLevelQuestions(level)).map((question) => ({
    question,
    order: shuffled(question.options.map((_, i) => i)),
  }));
}

/**
 * Stars from the correct count (unchanged by the unlock rule):
 * 26–30 = 3 stars, 21–25 = 2 stars, 16–20 = 1 star, otherwise 0.
 * Note: a Basic clear at 15 correct earns 0 stars.
 */
export function starsForCorrect(correct: number): number {
  if (correct >= 26) return 3;
  if (correct >= 21) return 2;
  if (correct >= 16) return 1;
  return 0;
}

export interface LevelsProgress {
  /** Highest unlocked level (1..50). Level 1 is unlocked by default. */
  unlocked: number;
  /** level -> best stars earned (0..3). */
  stars: Record<number, number>;
  /** level -> best correct count (0..30). */
  best: Record<number, number>;
}

export const DEFAULT_LEVELS_PROGRESS: LevelsProgress = {
  unlocked: 1,
  stars: {},
  best: {},
};

export function loadLevelsProgress(): LevelsProgress {
  try {
    const raw = window.localStorage.getItem(LEVELS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LEVELS_PROGRESS, stars: {}, best: {} };
    const parsed = JSON.parse(raw) as Partial<LevelsProgress>;
    const unlocked =
      typeof parsed.unlocked === "number"
        ? Math.min(LEVELS_COUNT, Math.max(1, Math.floor(parsed.unlocked)))
        : 1;
    const stars: Record<number, number> = {};
    const best: Record<number, number> = {};
    for (const [k, v] of Object.entries(parsed.stars ?? {})) {
      const n = Number(k);
      if (Number.isInteger(n) && n >= 1 && n <= LEVELS_COUNT && typeof v === "number") {
        stars[n] = Math.min(3, Math.max(0, Math.floor(v)));
      }
    }
    for (const [k, v] of Object.entries(parsed.best ?? {})) {
      const n = Number(k);
      if (Number.isInteger(n) && n >= 1 && n <= LEVELS_COUNT && typeof v === "number") {
        best[n] = Math.min(QUESTIONS_PER_LEVEL, Math.max(0, Math.floor(v)));
      }
    }
    return { unlocked, stars, best };
  } catch {
    return { ...DEFAULT_LEVELS_PROGRESS, stars: {}, best: {} };
  }
}

export function saveLevelsProgress(progress: LevelsProgress): void {
  try {
    window.localStorage.setItem(LEVELS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* Storage unavailable — progress just won't persist. */
  }
}

export interface LevelResult {
  progress: LevelsProgress;
  stars: number;
  cleared: boolean;
  unlockedNext: boolean;
}

/** Apply a finished level attempt to progress. Pure — caller saves it. */
export function applyLevelResult(
  progress: LevelsProgress,
  level: number,
  correct: number,
): LevelResult {
  const cleared = isLevelCleared(level, correct);
  /* Stars only count on a cleared level: a Basic clear at 15 correct
     earns 0 stars, and a failed attempt earns none either. */
  const stars = cleared ? starsForCorrect(correct) : 0;
  const next: LevelsProgress = {
    unlocked: progress.unlocked,
    stars: { ...progress.stars },
    best: { ...progress.best },
  };
  next.best[level] = Math.max(next.best[level] ?? 0, correct);
  if (cleared) {
    next.stars[level] = Math.max(next.stars[level] ?? 0, stars);
  }
  let unlockedNext = false;
  if (cleared && level < LEVELS_COUNT && next.unlocked <= level) {
    next.unlocked = level + 1;
    unlockedNext = true;
  }
  return { progress: next, stars, cleared, unlockedNext };
}
