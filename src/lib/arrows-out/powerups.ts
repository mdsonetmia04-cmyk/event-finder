/* Arrows Out — power-up counts + reward totals, per-device only
   (localStorage, no database). Video-style economy:
   - Hint: starts with 1, +1 on the FIRST completion of each level.
   - Eraser: locked until level 7 is completed; starts with 1 then,
     +1 on the first completion of each later level (same rule).
   - Grid Scale: a free toggle, locked until level 5 is completed.
   - Rewards: +5 coins and +100 piggy on EVERY level completion.
   Using a Hint or the Eraser in an attempt costs a star at level
   end (3 stars = none used, 2 = one used, 1 = more). The grid
   toggle never costs a star. */

export interface PowerupCounts {
  hints: number;
  erasers: number;
}

export interface RewardTotals {
  coins: number;
  piggy: number;
}

export const POWERUPS_KEY = "ssc:arrows-out:powerups";
export const REWARDS_KEY = "ssc:arrows-out:rewards";

export const HINT_START_COUNT = 1;
export const COINS_PER_WIN = 5;
export const PIGGY_PER_WIN = 100;
/** Grid Scale unlocks after completing this level. */
export const GRID_UNLOCK_LEVEL = 5;
/** Eraser unlocks after completing this level. */
export const ERASER_UNLOCK_LEVEL = 7;

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota: counts just won't persist.
  }
}

export function loadPowerups(): PowerupCounts {
  const raw = readJson<Partial<PowerupCounts>>(POWERUPS_KEY);
  const hints = typeof raw?.hints === "number" && raw.hints >= 0 ? Math.floor(raw.hints) : HINT_START_COUNT;
  const erasers = typeof raw?.erasers === "number" && raw.erasers >= 0 ? Math.floor(raw.erasers) : 0;
  return { hints, erasers };
}

export function savePowerups(counts: PowerupCounts): void {
  writeJson(POWERUPS_KEY, { hints: Math.max(0, counts.hints), erasers: Math.max(0, counts.erasers) });
}

export function loadRewards(): RewardTotals {
  const raw = readJson<Partial<RewardTotals>>(REWARDS_KEY);
  const coins = typeof raw?.coins === "number" && raw.coins >= 0 ? Math.floor(raw.coins) : 0;
  const piggy = typeof raw?.piggy === "number" && raw.piggy >= 0 ? Math.floor(raw.piggy) : 0;
  return { coins, piggy };
}

export function saveRewards(totals: RewardTotals): void {
  writeJson(REWARDS_KEY, { coins: Math.max(0, totals.coins), piggy: Math.max(0, totals.piggy) });
}

/** True once the given level has been completed at least once. */
export function isLevelCompleted(stars: Record<number, number>, n: number): boolean {
  return (stars[n] ?? 0) > 0;
}

export function isGridUnlocked(stars: Record<number, number>): boolean {
  return isLevelCompleted(stars, GRID_UNLOCK_LEVEL);
}

export function isEraserUnlocked(stars: Record<number, number>): boolean {
  return isLevelCompleted(stars, ERASER_UNLOCK_LEVEL);
}
