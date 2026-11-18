/* Save & resume for LOCAL Ludo games only (friends rooms are
   server state and are never saved here). One slot in localStorage,
   schema-versioned, and VALIDATED before anything is restored — a
   corrupt, hand-edited, or outdated save is ignored, never trusted.

   The save is written on every state change while a local game is in
   progress and cleared when the game finishes or a new game starts,
   so "Resume" only ever offers an unfinished game. */

import { COLORS, type LudoRules, type LudoState } from "./engine";
import { isLudoRules, parseLocalSettings, type LudoLocalSettings } from "./settings";

export const LOCAL_SAVE_VERSION = 1;

const SAVE_KEY = "ssc:ludo:local-save";

export interface LocalPlayerStats {
  moves: number;
  captures: number;
  sixes: number;
}

export function emptyPlayerStats(): LocalPlayerStats {
  return { moves: 0, captures: 0, sixes: 0 };
}

export interface SavedLocalGame {
  version: number;
  savedAt: number;
  game: LudoState;
  /** Number of HUMAN seats: 1 = vs Sweet AI, 2-4 = pass-and-play. */
  humans: 1 | 2 | 3 | 4;
  settings: LudoLocalSettings;
  gameKey: number;
  startedAt: number;
  stats: LocalPlayerStats[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Strict validation of an engine state: player count, colours in
    seating order, token ranges, phase/turn/roll consistency. */
export function isValidLudoState(value: unknown): value is LudoState {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.players)) return false;
  if (value.players.length < 2 || value.players.length > 4) return false;
  for (let i = 0; i < value.players.length; i++) {
    const p = value.players[i];
    if (!isRecord(p)) return false;
    if (p.color !== COLORS[i]) return false;
    if (!Array.isArray(p.tokens) || p.tokens.length !== 4) return false;
    for (const tok of p.tokens) {
      if (typeof tok !== "number" || !Number.isInteger(tok) || tok < -1 || tok > 57) return false;
    }
  }
  if (typeof value.turn !== "number" || !Number.isInteger(value.turn) || value.turn < 0 || value.turn >= value.players.length) return false;
  if (value.phase !== "roll" && value.phase !== "move" && value.phase !== "finished") return false;
  if (value.roll !== null && (typeof value.roll !== "number" || !Number.isInteger(value.roll) || value.roll < 1 || value.roll > 6)) return false;
  if (value.phase === "move" && value.roll === null) return false;
  if (value.phase === "roll" && value.roll !== null) return false;
  if (value.lastRoll !== null && (typeof value.lastRoll !== "number" || !Number.isInteger(value.lastRoll) || value.lastRoll < 1 || value.lastRoll > 6)) {
    return false;
  }
  if (typeof value.sixes !== "number" || !Number.isInteger(value.sixes) || value.sixes < 0) return false;
  if (value.winner !== null && (typeof value.winner !== "number" || !Number.isInteger(value.winner) || value.winner < 0 || value.winner >= value.players.length)) {
    return false;
  }
  if (value.phase === "finished" && value.winner === null) return false;
  if (value.phase !== "finished" && value.winner !== null) return false;
  if (typeof value.move_no !== "number" || !Number.isInteger(value.move_no) || value.move_no < 0) return false;
  if (
    value.lastBonus !== undefined &&
    value.lastBonus !== null &&
    value.lastBonus !== "six" &&
    value.lastBonus !== "capture" &&
    value.lastBonus !== "home" &&
    value.lastBonus !== "forfeit"
  ) {
    return false;
  }
  return true;
}

function isValidStats(value: unknown, players: number): value is LocalPlayerStats[] {
  if (!Array.isArray(value) || value.length !== players) return false;
  for (const s of value) {
    if (!isRecord(s)) return false;
    if (typeof s.moves !== "number" || !Number.isInteger(s.moves) || s.moves < 0) return false;
    if (typeof s.captures !== "number" || !Number.isInteger(s.captures) || s.captures < 0) return false;
    if (typeof s.sixes !== "number" || !Number.isInteger(s.sixes) || s.sixes < 0) return false;
  }
  return true;
}

/** Parse + validate an untrusted saved game. Returns null for
    anything malformed, outdated, or already finished. */
export function parseSavedLocalGame(value: unknown): SavedLocalGame | null {
  if (!isRecord(value)) return null;
  if (value.version !== LOCAL_SAVE_VERSION) return null;
  if (typeof value.savedAt !== "number" || !Number.isInteger(value.savedAt) || value.savedAt <= 0) return null;
  if (!isValidLudoState(value.game)) return null;
  if (value.game.phase === "finished") return null;
  if (value.humans !== 1 && value.humans !== 2 && value.humans !== 3 && value.humans !== 4) return null;
  if (value.humans > 1 && value.game.players.length !== value.humans) return null;
  if (value.humans === 1 && value.game.players.length !== 4) return null;
  const settings = parseLocalSettings(value.settings);
  if (!settings) return null;
  /* The engine state carries its own copy of the rules; a save whose
     two copies disagree was hand-edited or written by mixed code. */
  if (!isLudoRules(value.game.rules)) return null;
  const gameRules = value.game.rules as LudoRules;
  const ruleKeys: (keyof LudoRules)[] = [
    "entryOnSix",
    "bonusOnSix",
    "bonusOnCapture",
    "bonusOnHome",
    "threeSixes",
    "safeStars",
    "safeStarts",
    "blockade",
  ];
  if (ruleKeys.some((k) => gameRules[k] !== settings.rules[k])) return null;
  if (typeof value.gameKey !== "number" || !Number.isInteger(value.gameKey) || value.gameKey < 0) return null;
  if (typeof value.startedAt !== "number" || !Number.isInteger(value.startedAt) || value.startedAt <= 0) return null;
  if (!isValidStats(value.stats, value.game.players.length)) return null;
  return {
    version: LOCAL_SAVE_VERSION,
    savedAt: value.savedAt,
    game: value.game,
    humans: value.humans,
    settings,
    gameKey: value.gameKey,
    startedAt: value.startedAt,
    stats: value.stats,
  };
}

export function loadSavedLocalGame(): SavedLocalGame | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return parseSavedLocalGame(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveLocalGame(saved: SavedLocalGame): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
  } catch {
    /* Storage unavailable — the game still plays; resume just won't
       be offered after a reload. */
  }
}

export function clearSavedLocalGame(): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    /* Ignore — a stale save is validated (and rejected) on load. */
  }
}
