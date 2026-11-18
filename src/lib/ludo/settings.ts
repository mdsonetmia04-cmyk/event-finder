/* Local-game settings for Ludo: the pre-match Rules & Settings
   panel. Friends rooms always play classic rules and never read
   these settings. Settings persist in localStorage so a player's
   choices survive reloads; invalid stored values fall back to the
   defaults. All storage access is guarded — private mode or a
   missing window must never throw. */

import { CLASSIC_RULES, type LudoRules } from "./engine";

export type AiDifficulty = "easy" | "medium" | "hard";

export type AnimationSpeed = "slow" | "normal" | "fast";

export interface LudoLocalSettings {
  rules: LudoRules;
  sound: boolean;
  animationSpeed: AnimationSpeed;
  aiDifficulty: AiDifficulty;
}

export const DEFAULT_LOCAL_SETTINGS: LudoLocalSettings = {
  rules: { ...CLASSIC_RULES },
  sound: true,
  animationSpeed: "normal",
  aiDifficulty: "medium",
};

/** Milliseconds per animation beat, by speed. "normal" matches the
    timings the game has always used (135ms hops, 550ms fly-home,
    800ms dice settle) so the default feel is unchanged. */
export interface AnimationTimings {
  hopMs: number;
  flyHomeMs: number;
  settleMs: number;
  botRollDelayMs: number;
  botMoveDelayMs: number;
  autoPassMs: number;
}

export const ANIMATION_TIMINGS: Record<AnimationSpeed, AnimationTimings> = {
  slow: { hopMs: 210, flyHomeMs: 800, settleMs: 1100, botRollDelayMs: 1100, botMoveDelayMs: 1000, autoPassMs: 1200 },
  normal: { hopMs: 135, flyHomeMs: 550, settleMs: 800, botRollDelayMs: 800, botMoveDelayMs: 700, autoPassMs: 900 },
  fast: { hopMs: 80, flyHomeMs: 320, settleMs: 500, botRollDelayMs: 450, botMoveDelayMs: 400, autoPassMs: 600 },
};

const SETTINGS_KEY = "ssc:ludo:local-settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Strict shape check for a rule set (also used by save validation). */
export function isLudoRules(value: unknown): value is LudoRules {
  if (!isRecord(value)) return false;
  const keys: (keyof LudoRules)[] = [
    "entryOnSix",
    "bonusOnSix",
    "bonusOnCapture",
    "bonusOnHome",
    "threeSixes",
    "safeStars",
    "safeStarts",
    "blockade",
  ];
  return keys.every((k) => typeof value[k] === "boolean");
}

export function parseLocalSettings(value: unknown): LudoLocalSettings | null {
  if (!isRecord(value)) return null;
  if (!isLudoRules(value.rules)) return null;
  if (typeof value.sound !== "boolean") return null;
  if (value.animationSpeed !== "slow" && value.animationSpeed !== "normal" && value.animationSpeed !== "fast") {
    return null;
  }
  if (value.aiDifficulty !== "easy" && value.aiDifficulty !== "medium" && value.aiDifficulty !== "hard") {
    return null;
  }
  return {
    rules: { ...value.rules },
    sound: value.sound,
    animationSpeed: value.animationSpeed,
    aiDifficulty: value.aiDifficulty,
  };
}

export function loadLocalSettings(): LudoLocalSettings {
  try {
    if (typeof window === "undefined") return { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
    const parsed = parseLocalSettings(JSON.parse(raw) as unknown);
    if (!parsed) return { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
    return parsed;
  } catch {
    return { ...DEFAULT_LOCAL_SETTINGS, rules: { ...CLASSIC_RULES } };
  }
}

export function saveLocalSettings(settings: LudoLocalSettings): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* Storage unavailable — the in-memory settings still apply. */
  }
}
