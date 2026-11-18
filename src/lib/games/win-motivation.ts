/* Win-screen motivation + Adobe Stock nudge for the Gaming Zone.
   Owner's order (2026-11-18): every Bubble Shooter win shows ONE
   Bengali motivation line; from the 3rd win in a session onward, EVERY
   game's win screen also tells the player to go make Adobe Stock
   assets. Both texts stay in Bengali in BOTH site language modes, so
   they live here as constants — never in the EN/BN dictionaries.

   Win counting is session-scoped (sessionStorage): closing the tab
   resets it. A loss never resets the counter. Each distinct win counts
   EXACTLY ONCE: callers pass a stable win identity (game + level/run
   or room + finish timestamp), and recordWin dedupes re-renders,
   overlay re-opens and page reloads showing the same finished state
   via a per-win marker. A new game/replay/level is a new identity and
   counts again. */

export type WinGameId = "bubble-shooter" | "arrows-out" | "quiz-battle" | "ludo" | "draw-guess";

/** Bengali motivation lines for Bubble Shooter wins, shown verbatim in
    both language modes. One random line per win. */
export const WIN_MOTIVATION_LINES: readonly string[] = [
  "চমৎকার!",
  "অসাধারণ!",
  "দারুণ খেলেছেন!",
  "আপনি অনেক ভালো পারেন দেখছি!",
  "ওয়াও, কী দারুণ খেলা!",
  "বাহ, চমৎকার!",
  "অসাধারণ পারফরম্যান্স!",
  "দারুণ, এভাবেই চালিয়ে যান!",
  "কী দারুণ খেললেন!",
  "আপনার নিশানা একদম নিখুঁত!",
  "চোখ ধাঁধানো খেলা!",
  "আপনি তো চ্যাম্পিয়ন!",
  "এমন খেলা সবাই পারে না!",
  "দারুণ বুদ্ধির খেলা!",
  "কী সুন্দর করে জিতলেন!",
  "এই তো, আসল খেলোয়াড়!",
  "বাহ, কী চমৎকার জয়!",
  "আপনি সত্যিই দারুণ খেলেন!",
  "একদম পারফেক্ট!",
  "জয়ের ধারা ধরে রাখুন!",
  "আপনার মনোযোগ দেখার মতো!",
  "দারুণ কৌশল!",
  "ওয়াও, আবার জিতে গেলেন!",
  "প্রতিটা শট একদম ঠিক জায়গায়!",
];

/** Win-screen nudge, shown from the 3rd session win onward in every
    game. Bengali in both language modes. Text only — no link target
    exists for asset-making. */
export const ADOBE_STOCK_NUDGE = "অনেক খেলেছেন, এবার অ্যাডোবি স্টকের অ্যাসেট বানান।";

/** The nudge appears on the Nth win and every win after it. */
export const NUDGE_AFTER_WINS = 3;

const COUNT_KEY_PREFIX = "ssc:win-count:";
const COUNTED_KEY_PREFIX = "ssc:win-counted:";
const LAST_LINE_KEY = "ssc:win-motivation:last";

/* In-memory fallbacks when sessionStorage is unavailable (private
   mode, quota): the feature still works for the lifetime of the page. */
const memoryCounts = new Map<WinGameId, number>();
const memoryCounted = new Set<string>();
let memoryLastLine = -1;

function sessionGet(key: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionSet(key: string, value: string): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the in-memory fallback carries the session.
  }
}

function readCount(game: WinGameId): number {
  const raw = sessionGet(`${COUNT_KEY_PREFIX}${game}`);
  const n = raw === null ? NaN : Number(raw);
  if (Number.isInteger(n) && n >= 0) return n;
  return memoryCounts.get(game) ?? 0;
}

function writeCount(game: WinGameId, count: number): void {
  memoryCounts.set(game, count);
  sessionSet(`${COUNT_KEY_PREFIX}${game}`, String(count));
}

/** Pick one motivation line at random, never repeating the previous
    line within the session. */
export function pickMotivationLine(): string {
  const rawLast = sessionGet(LAST_LINE_KEY);
  const parsed = rawLast === null ? NaN : Number(rawLast);
  const last = Number.isInteger(parsed) ? parsed : memoryLastLine;
  let idx = Math.floor(Math.random() * WIN_MOTIVATION_LINES.length);
  if (WIN_MOTIVATION_LINES.length > 1 && idx === last) {
    idx = (idx + 1 + Math.floor(Math.random() * (WIN_MOTIVATION_LINES.length - 1))) % WIN_MOTIVATION_LINES.length;
  }
  memoryLastLine = idx;
  sessionSet(LAST_LINE_KEY, String(idx));
  return WIN_MOTIVATION_LINES[idx];
}

/**
 * Record one win for `game`. The win counts exactly once per session:
 * if `winId` was already counted (re-render, overlay re-open, or a
 * reload showing the same finished state), the existing count is
 * returned without incrementing. Returns the session win count (after
 * recording, when new) and whether this call was the one that counted
 * the win.
 */
export function recordWin(game: WinGameId, winId: string): { count: number; isNew: boolean } {
  const marker = `${COUNTED_KEY_PREFIX}${game}:${winId}`;
  if (memoryCounted.has(marker) || sessionGet(marker) === "1") {
    return { count: readCount(game), isNew: false };
  }
  memoryCounted.add(marker);
  sessionSet(marker, "1");
  const count = readCount(game) + 1;
  writeCount(game, count);
  return { count, isNew: true };
}
