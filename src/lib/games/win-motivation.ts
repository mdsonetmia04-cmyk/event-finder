/* Post-match Adobe Stock lines + 3rd-win nudge for the Gaming Zone.
   Owner's order (2026-11-18): after EVERY match ends, in EVERY game,
   show ONE Bengali line — a win-pool line for a win (draws/ties count
   as wins), a loss-pool line for a clear loss. The line is never the
   same twice in a row within a session, per pool. From the 3rd win in
   a session onward, every game's win screen ALSO shows the Adobe
   Stock nudge banner. All texts stay in Bengali in BOTH site language
   modes, so they live here as constants — never in the EN/BN
   dictionaries.

   Win counting is session-scoped (sessionStorage): closing the tab
   resets it. A loss never resets the counter. Each distinct win counts
   EXACTLY ONCE: callers pass a stable win identity (game + level/run
   or room + finish timestamp), and recordWin dedupes re-renders,
   overlay re-opens and page reloads showing the same finished state
   via a per-win marker. A new game/replay/level is a new identity and
   counts again.

   Post-match lines are picked with pickPostMatchLine(outcome, key):
   the key is the match identity (same identity the caller uses for
   recordWin, where one exists). The picked line is stored per key, so
   re-renders, overlay re-opens and reloads showing the same finished
   match always show the SAME line, while a new match picks a fresh
   one (never repeating the previous line of that pool).

   Room games ALSO show one shared team advice line to every player
   at match end, picked with pickTeamLine(key): the pick is a pure
   hash of the match identity, so all players in the room resolve the
   SAME line. See pickTeamLine for why the per-client no-repeat rule
   cannot apply there. */

export type WinGameId = "bubble-shooter" | "arrows-out" | "quiz-battle" | "word-battle" | "ludo" | "draw-guess" | "chess";

/** Outcome of a finished match from the viewing player's side.
    Draws/ties are reported as "win" (positive framing). */
export type PostMatchOutcome = "win" | "loss";

/** Bengali post-match lines for wins, shown verbatim in both language
    modes. Approved by the owner 2026-11-18 — do not paraphrase. */
export const POST_MATCH_WIN_LINES: readonly string[] = [
  "আমরা জানি আপনি অনেক ভালো খেলেন, এখন ট্রেন্ডিং টপিক নিয়ে কিছু EPS ডিজাইন করে আসুন।",
  "আপনি ভালো খেলেছেন, এবার JPG করে আসুন।",
  "দারুণ খেলেছেন! এবার গিয়ে কিছু PNG আর SVG বানিয়ে আসুন।",
  "চমৎকার জয়! ক্যালেন্ডারে আগামী সিজনটা দেখে একটা অ্যাসেট বানিয়ে ফেলুন।",
  "অসাধারণ! এই ভালো মন নিয়ে এখন টাইটেল আর কীওয়ার্ড লিখে ফেলুন।",
  "আপনি তো চ্যাম্পিয়ন! এবার পুরনো ডিজাইনের নতুন ভার্সন বানিয়ে আপলোড করুন।",
  "দারুণ জয়! এই হাতেই এখন একটা EPS বানিয়ে ফেলুন — ট্রেন্ডিং টপিকে!",
  "কী খেললেন! এবার গিয়ে JPG বানান, অ্যাডোবি স্টকে বিক্রি হবে।",
  "বাহ, চ্যাম্পিয়ন! এখন ক্যালেন্ডার খুলে সামনের সিজনের ডিজাইন শুরু করুন।",
  "অসাধারণ! জয়ের আনন্দে একটা আইকন সেট বানিয়ে ফেলুন।",
  "আপনি তো আগুন! এই গতি ধরে রেখে আজই ৫টা ডিজাইন আপলোড করুন।",
  "চমৎকার! এবার গিয়ে ব্যাকগ্রাউন্ড আর প্যাটার্ন ডিজাইন করুন — খুব চলে!",
  "কী দারুণ বুদ্ধি! এই বুদ্ধি দিয়ে এখন একটা ভেক্টর ইলাস্ট্রেশন বানান।",
  "জিতে গেলেন! এবার গিয়ে ডিজাইনের টাইটেলটা ঝকঝকে করে লিখুন আর ৪৯টা কীওয়ার্ড বসান।",
  "দারুণ খেলেছেন! ট্রেন্ডিং টপিকটা দেখে এখনই একটা সেট বানিয়ে আসুন।",
  "ওয়াও! এত ভালো খেলেন, এবার অ্যাডোবি স্টকে আপনার নাম ছড়িয়ে দিন।",
  "পারফেক্ট খেলা! এখন গিয়ে পুরনো ডিজাইনের রঙ বদলে নতুন ভার্সন বানান।",
  "বাহ! এই জয়ের খুশিতে একটা সিজনাল পোস্টার ডিজাইন করুন।",
  "আপনি সত্যিই দারুণ! এবার গিয়ে PNG কাটআউট বানান — ক্রেতারা খোঁজে!",
  "চোখ ধাঁধানো জয়! এখন একটা মিনিমাল লোগো সেট বানিয়ে ফেলুন।",
  "কী সুন্দর করে জিতলেন! এবার গিয়ে আজকের আপলোডটা শেষ করুন।",
  "দারুণ কৌশল! এই কৌশলেই এখন ট্রেন্ডিং নিশে ১০টা ডিজাইন বানান।",
  "জয়ের ধারা ধরে রাখুন! আর অ্যাডোবি স্টকে প্রতিদিন আপলোডের ধারাটাও।",
  "আপনি অনেক ভালো পারেন দেখছি! এবার গিয়ে একটা ইনফোগ্রাফিক টেমপ্লেট বানান।",
  "একদম পারফেক্ট! এখন গিয়ে আপনার পোর্টফোলিওতে আরও ৩টা ডিজাইন যোগ করুন।",
  "বাহ, কী চমৎকার জয়! এবার গিয়ে দেখুন কোন ডিজাইনটা বিক্রি হলো!",
];

/** Bengali post-match lines for losses, shown verbatim in both
    language modes. Approved by the owner 2026-11-18 — do not
    paraphrase. */
export const POST_MATCH_LOSS_LINES: readonly string[] = [
  "আপনি পারবেন না, তার চেয়ে এখন গিয়ে অ্যাসেট বানান, অ্যাডোবিতে বিক্রি করতে পারবেন।",
  "এই ম্যাচটা জেতা হলো না — মন খারাপ নয়, এখন গিয়ে একটা ডিজাইন বানান, সেটাই আসল জয়।",
  "হার মানেই শেষ নয় — এখন ট্রেন্ডিং টপিকে একটা EPS বানিয়ে ফেলুন।",
  "এই ম্যাচটা হলো না — তবে অ্যাসেট বানালে হার বলে কিছু নেই, ওখানে শুধু আয়!",
  "হারলেন তো কী! এখন গিয়ে একটা EPS বানান, সেটা সারাজীবন বিক্রি হবে।",
  "গেমে হারলেন, তাতে কী — একটা ভালো ডিজাইন বানিয়ে আজকের দিনটা জিতে নিন।",
  "এবার হলো না, পরেরবার হবে। তার আগে একটা JPG বানিয়ে আপলোড দিয়ে আসুন।",
  "খেলায় হার, কাজে জয় — এখন গিয়ে ট্রেন্ডিং টপিকে ডিজাইন বানান।",
  "এই হারটা ভুলে যান, একটা সুন্দর ভেক্টর বানালে মন ভালো হয়ে যাবে।",
  "পারলেন না তো কী হয়েছে! অ্যাডোবি স্টকে আপনার ডিজাইন ঠিকই পারবে।",
  "হেরে গেলেন? ভালোই হলো — এখন সময়টা কাজে লাগিয়ে ২টা অ্যাসেট বানিয়ে ফেলুন।",
  "গেম শেষ, এবার আসল খেলা — ডিজাইন বানিয়ে ডলার আয় করুন!",
  "ম্যাচটা গেল, কিন্তু আজকের আপলোডটা যেন না যায় — এখনই বানাতে বসুন।",
];

/** Bengali team advice lines for ROOM games, shown verbatim in both
    language modes to every player in the room at match end, in
    addition to each player's own win/loss post-match line. Approved
    by the owner 2026-11-18 — do not paraphrase. */
export const TEAM_ADVICE_LINES: readonly string[] = [
  "আপনারা সবাই ভালো খেলেছেন। এবার অ্যাডোবি স্টক থেকে আয় করার কথা ভাবুন। আয় বাড়ান।",
  "দারুণ খেলেছেন সবাই! এবার একসাথে ট্রেন্ডিং টপিকে ডিজাইন বানান, আয় বাড়বে।",
  "সবাই চমৎকার খেলেছেন! এবার গিয়ে EPS ডিজাইন করুন — প্রতিটা বিক্রি মানেই আয়।",
  "কী সুন্দর খেলা হলো! এবার এই সময়টা কাজে লাগিয়ে JPG বানান, অ্যাডোবি স্টকে আয় করুন।",
  "আপনারা সবাই দারুণ! এবার ক্যালেন্ডারের সিজনাল টপিক দেখে অ্যাসেট বানান, আয় বাড়ান।",
  "দারুণ টিম খেলা! এবার গিয়ে পোর্টফোলিও বড় করুন — বেশি ডিজাইন, বেশি আয়।",
  "সবাই ভালো খেলেছেন! এবার টাইটেল আর কীওয়ার্ড ঠিক করে আপলোড দিন, বিক্রি বাড়বে।",
  "চমৎকার ম্যাচ! এবার গিয়ে নতুন ডিজাইন বানান — আজকের আপলোড, আগামীর আয়।",
  "আপনারা সবাই চ্যাম্পিয়ন! এবার অ্যাডোবি স্টকে নিয়মিত আপলোডের অভ্যাস করুন, আয় বাড়বে।",
  "দারুণ খেলেছেন! এবার গিয়ে পুরনো ডিজাইনের নতুন ভার্সন বানান — এক ডিজাইন, বারবার আয়।",
  "সবাই অসাধারণ খেলেছেন! এবার ট্রেন্ডিং নিশে একটা সেট বানিয়ে ফেলুন, আয় বাড়ান।",
  "কী দারুণ খেলা! এবার গিয়ে দেখুন কোন ডিজাইন বিক্রি হলো, আর সেই ধারায় আরও বানান।",
];

/** Win-screen nudge, shown from the 3rd session win onward in every
    game. Bengali in both language modes. Text only — no link target
    exists for asset-making. */
export const ADOBE_STOCK_NUDGE = "অনেক খেলেছেন, এবার অ্যাডোবি স্টকের অ্যাসেট বানান।";

/** The nudge appears on the Nth win and every win after it. */
export const NUDGE_AFTER_WINS = 3;

const COUNT_KEY_PREFIX = "ssc:win-count:";
const COUNTED_KEY_PREFIX = "ssc:win-counted:";
const LINE_KEY_PREFIX = "ssc:post-match-line:";
const LAST_WIN_LINE_KEY = "ssc:post-match:last-win";
const LAST_LOSS_LINE_KEY = "ssc:post-match:last-loss";

/* In-memory fallbacks when sessionStorage is unavailable (private
   mode, quota): the feature still works for the lifetime of the page. */
const memoryCounts = new Map<WinGameId, number>();
const memoryCounted = new Set<string>();
const memoryLines = new Map<string, number>();
let memoryLastWinLine = -1;
let memoryLastLossLine = -1;

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

/** Random index into a pool of `length`, never equal to `last`
    (when the pool has more than one line). */
function pickFreshIndex(length: number, last: number): number {
  let idx = Math.floor(Math.random() * length);
  if (length > 1 && idx === last) {
    idx = (idx + 1 + Math.floor(Math.random() * (length - 1))) % length;
  }
  return idx;
}

/**
 * Pick the post-match line for one finished match. The same `key`
 * always returns the same line within the session (re-renders and
 * reloads showing the same finished match never swap it); a new key
 * picks a fresh line, never repeating the previous line of that pool.
 * Safe to call during render: it triggers no state updates.
 */
export function pickPostMatchLine(outcome: PostMatchOutcome, key: string): string {
  const pool = outcome === "win" ? POST_MATCH_WIN_LINES : POST_MATCH_LOSS_LINES;
  const marker = `${LINE_KEY_PREFIX}${outcome}:${key}`;
  const raw = sessionGet(marker);
  const parsed = raw === null ? NaN : Number(raw);
  if (Number.isInteger(parsed) && parsed >= 0 && parsed < pool.length) return pool[parsed];
  const memorized = memoryLines.get(marker);
  if (memorized !== undefined && memorized < pool.length) return pool[memorized];
  const lastKey = outcome === "win" ? LAST_WIN_LINE_KEY : LAST_LOSS_LINE_KEY;
  const rawLast = sessionGet(lastKey);
  const parsedLast = rawLast === null ? NaN : Number(rawLast);
  const last = Number.isInteger(parsedLast) ? parsedLast : outcome === "win" ? memoryLastWinLine : memoryLastLossLine;
  const idx = pickFreshIndex(pool.length, last);
  if (outcome === "win") memoryLastWinLine = idx;
  else memoryLastLossLine = idx;
  sessionSet(lastKey, String(idx));
  memoryLines.set(marker, idx);
  sessionSet(marker, String(idx));
  return pool[idx];
}

/** FNV-1a 32-bit hash: deterministic across clients, reloads and
    browsers, so every player in a room resolves the same team line
    for the same match key. */
function hashTeamKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Pick the shared team advice line for one finished room match. The
 * pick is a pure function of `key` (room id + finish timestamp), so
 * all players in the room see the SAME line, and re-renders, overlay
 * re-opens and reloads never swap it. Different matches hash to
 * different lines (pseudo-random spread over the pool).
 *
 * Deliberately NOT a random per-client pick with a no-repeat rule:
 * each client's "previous line" differs, so a no-repeat adjustment
 * would make players in the same room see different lines. The
 * same-line-per-match guarantee takes precedence; consecutive
 * matches repeat a line only by hash chance (1 in 12).
 */
export function pickTeamLine(key: string): string {
  return TEAM_ADVICE_LINES[hashTeamKey(key) % TEAM_ADVICE_LINES.length];
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
