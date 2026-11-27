/* Shared Multiplayer Word Meaning Battle room types + pure helpers
   (no I/O). Row shapes mirror supabase/add-word-battle.sql
   (migration v28) as returned by the get_word_room() RPC — the only
   read path, since direct SELECT on word_rooms is denied so the
   correct answers (held server-side in correct_indices) can never
   reach a client before a question's reveal. Room codes reuse the
   Ludo scheme (same alphabet, generation and validation) — never
   invent a second scheme. Questions come from the 300-word bank
   (src/lib/words/bank-*.ts); the host's client draws 10 for a match
   and the server stores their ids, shuffled option orders and correct
   display indices. */

import { LOBBY_FRESH_MS } from "../ludo/room";
import {
  WORD_BANK,
  correctWordDisplayIndex,
  drawWordQuestions,
  wordById,
  type WordBattleQuestion,
  type WordEntry,
} from "./bank";

export type WordRoomStatus = "waiting" | "playing" | "finished";

export type WordPhase = "question" | "reveal";

export interface WordPlayer {
  user_id: string;
  name: string;
  avatar_url: string | null;
  score: number;
  /** Tiebreak: sum of answer times in ms (a timeout counts 15,000). */
  total_ms: number;
  seat: number;
  /** Has left mid-match: earned marks stay, no more answers. */
  has_left: boolean;
  /** Answered the current question. */
  answered: boolean;
}

export interface WordRevealAnswer {
  user_id: string;
  picked: number;
  correct: boolean;
  ms: number;
}

export interface WordReveal {
  /** Correct DISPLAY index (0..3) for the current question. */
  correct: number;
  answers: WordRevealAnswer[];
}

export interface WordAnswer {
  user_id: string;
  q_index: number;
  picked: number;
  correct: boolean;
  ms: number;
}

export interface WordRoom {
  id: string;
  code: string;
  host_id: string;
  status: WordRoomStatus;
  max_players: number;
  /** Null while waiting/finished; question/reveal while playing. */
  phase: WordPhase | null;
  /** Current question index (0..9). */
  current_q: number;
  /** Current question's bank id — playing only, null otherwise. */
  question_id: string | null;
  /** Current question's display order — playing only, null otherwise. */
  question_order: number[] | null;
  /** Reveal payload — present only while phase = 'reveal'. */
  reveal: WordReveal | null;
  /** Deadline of the current phase (question 15s / reveal 8s). */
  question_ends_at: string | null;
  /** Full question list — finished rooms only (review). */
  question_ids: string[];
  question_orders: number[][];
  /** Every answer — finished rooms only (review). */
  all_answers: WordAnswer[];
  created_at: string;
  updated_at: string;
  players: WordPlayer[];
}

/** One row from the list_word_rooms() RPC: safe lobby fields only. */
export interface WordLobbyRoom {
  id: string;
  code: string;
  host_name: string | null;
  player_count: number;
  max_players: number;
  updated_at: string;
}

/** One row from the find_word_room() RPC (join-by-code). */
export interface WordRoomLookup {
  id: string;
  code: string;
  status: WordRoomStatus;
  player_count: number;
  max_players: number;
  updated_at: string;
}

/** One player row inside a list_live_word_rooms() result: the same
    spectator-safe fields get_word_room() already exposes to
    non-members — name, avatar, score, seat. No question, ever. */
export interface WordLivePlayer {
  user_id: string;
  name: string;
  avatar_url: string | null;
  score: number;
  seat: number;
}

/** One row from the list_live_word_rooms() RPC (migration v28): a
    playing room for the /games/live spectator list. */
export interface WordLiveRoom {
  id: string;
  code: string;
  updated_at: string;
  players: WordLivePlayer[];
}

/** Match constants — mirror the migration v28 intervals. The server is
    authoritative (question_ends_at); these only size the client-side
    countdown bar. */
export const WORD_MATCH_QUESTIONS = 10;
export const WORD_QUESTION_MS = 15000;
export const WORD_REVEAL_MS = 8000;
export const WORD_MIN_PLAYERS = 2;
export const WORD_MAX_PLAYERS = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** The 300-word bank, indexed by id. */
let bankById: Map<string, WordEntry> | null = null;

function getBank(): Map<string, WordEntry> {
  if (!bankById) bankById = new Map(WORD_BANK.map((w) => [w.id, w]));
  return bankById;
}

export interface WordMatchDraw {
  /** Bank ids in match order. */
  ids: string[];
  /** Shuffled display order per question (display pos -> option idx). */
  orders: number[][];
  /** Correct DISPLAY index per question (what the server stores). */
  correct: number[];
  /** The drawn questions, for the host's own play. */
  questions: WordBattleQuestion[];
}

/** Draw a match's 10 questions: random across all 300 bank words,
    each with its own shuffled option order. Called by the HOST's client
    only; the draw is sent to start_word_game() so every player in the
    room sees the same 10 questions in the same order. */
export function drawWordMatchQuestions(): WordMatchDraw {
  const questions = drawWordQuestions(WORD_MATCH_QUESTIONS);
  return {
    ids: questions.map((bq) => bq.entry.id),
    orders: questions.map((bq) => bq.order),
    correct: questions.map((bq) => correctWordDisplayIndex(bq)),
    questions,
  };
}

/** Resolve a room question (bank id + display order from the RPC) to a
    WordBattleQuestion for rendering. Null when the id is not in the
    bank (a stale client after a bank edit). */
export function resolveWordMatchQuestion(
  id: string,
  order: number[],
): WordBattleQuestion | null {
  const entry = wordById(id);
  if (!entry) return null;
  if (order.length !== 4 || order.some((n) => n < 0 || n > 3)) return null;
  return { entry, order: [...order] };
}

/** Rank players for the scoreboard: most marks first; a marks tie goes
    to the fastest TOTAL answer time; a full tie falls back to seat. */
export function rankWordPlayers(players: WordPlayer[]): WordPlayer[] {
  return [...players].sort(
    (a, b) => b.score - a.score || a.total_ms - b.total_ms || a.seat - b.seat,
  );
}

/** Index of a user inside the seating order, or -1 when not seated. */
export function wordSeatIndex(room: WordRoom, userId: string): number {
  return room.players.findIndex((p) => p.user_id === userId);
}

function parseWordPlayer(entry: unknown): WordPlayer | null {
  if (!isRecord(entry)) return null;
  if (typeof entry.user_id !== "string" || typeof entry.name !== "string") return null;
  if (entry.avatar_url !== null && typeof entry.avatar_url !== "string") return null;
  if (
    typeof entry.score !== "number" ||
    typeof entry.total_ms !== "number" ||
    typeof entry.seat !== "number" ||
    typeof entry.has_left !== "boolean" ||
    typeof entry.answered !== "boolean"
  ) {
    return null;
  }
  return {
    user_id: entry.user_id,
    name: entry.name,
    avatar_url: entry.avatar_url,
    score: entry.score,
    total_ms: entry.total_ms,
    seat: entry.seat,
    has_left: entry.has_left,
    answered: entry.answered,
  };
}

function parsePlayers(value: unknown): WordPlayer[] | null {
  if (!Array.isArray(value)) return null;
  const players: WordPlayer[] = [];
  for (const entry of value) {
    const p = parseWordPlayer(entry);
    if (!p) return null;
    players.push(p);
  }
  return players;
}

function parseReveal(value: unknown): WordReveal | null {
  if (value === null) return null;
  if (!isRecord(value)) return null;
  if (typeof value.correct !== "number" || value.correct < 0 || value.correct > 3) return null;
  if (!Array.isArray(value.answers)) return null;
  const answers: WordRevealAnswer[] = [];
  for (const entry of value.answers) {
    if (!isRecord(entry)) return null;
    if (
      typeof entry.user_id !== "string" ||
      typeof entry.picked !== "number" ||
      typeof entry.correct !== "boolean" ||
      typeof entry.ms !== "number"
    ) {
      return null;
    }
    answers.push({
      user_id: entry.user_id,
      picked: entry.picked,
      correct: entry.correct,
      ms: entry.ms,
    });
  }
  return { correct: value.correct, answers };
}

function parseAllAnswers(value: unknown): WordAnswer[] | null {
  if (!Array.isArray(value)) return null;
  const answers: WordAnswer[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    if (
      typeof entry.user_id !== "string" ||
      typeof entry.q_index !== "number" ||
      typeof entry.picked !== "number" ||
      typeof entry.correct !== "boolean" ||
      typeof entry.ms !== "number"
    ) {
      return null;
    }
    answers.push({
      user_id: entry.user_id,
      q_index: entry.q_index,
      picked: entry.picked,
      correct: entry.correct,
      ms: entry.ms,
    });
  }
  return answers;
}

function parseIdList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (value.some((v) => typeof v !== "string")) return null;
  return [...(value as string[])];
}

function parseOrderList(value: unknown): number[][] | null {
  if (!Array.isArray(value)) return null;
  const out: number[][] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 4) return null;
    if (entry.some((n) => typeof n !== "number" || n < 0 || n > 3)) return null;
    out.push([...(entry as number[])]);
  }
  return out;
}

/** Validate an untyped get_word_room() result into a WordRoom, or null. */
export function parseWordRoom(row: unknown): WordRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (typeof row.host_id !== "string") return null;
  if (row.status !== "waiting" && row.status !== "playing" && row.status !== "finished") return null;
  if (typeof row.max_players !== "number") return null;
  if (row.phase !== null && row.phase !== "question" && row.phase !== "reveal") return null;
  if (typeof row.current_q !== "number") return null;
  if (row.question_id !== null && typeof row.question_id !== "string") return null;
  if (row.question_order !== null) {
    if (
      !Array.isArray(row.question_order) ||
      row.question_order.length !== 4 ||
      row.question_order.some((n: unknown) => typeof n !== "number" || n < 0 || n > 3)
    ) {
      return null;
    }
  }
  const reveal = parseReveal(row.reveal);
  if (row.reveal !== null && !reveal) return null;
  if (row.question_ends_at !== null && typeof row.question_ends_at !== "string") return null;
  const questionIds = parseIdList(row.question_ids);
  if (!questionIds) return null;
  const questionOrders = parseOrderList(row.question_orders);
  if (!questionOrders) return null;
  const allAnswers = parseAllAnswers(row.all_answers);
  if (!allAnswers) return null;
  if (typeof row.created_at !== "string" || typeof row.updated_at !== "string") return null;
  const players = parsePlayers(row.players);
  if (!players) return null;
  return {
    id: row.id,
    code: row.code,
    host_id: row.host_id,
    status: row.status,
    max_players: row.max_players,
    phase: row.phase,
    current_q: row.current_q,
    question_id: row.question_id,
    question_order: row.question_order as number[] | null,
    reveal,
    question_ends_at: row.question_ends_at,
    question_ids: questionIds,
    question_orders: questionOrders,
    all_answers: allAnswers,
    created_at: row.created_at,
    updated_at: row.updated_at,
    players,
  };
}

/** Validate an untyped list_word_rooms() row, or null. */
export function parseWordLobbyRoom(row: unknown): WordLobbyRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (row.host_name !== null && typeof row.host_name !== "string") return null;
  if (typeof row.player_count !== "number" || typeof row.max_players !== "number") return null;
  if (typeof row.updated_at !== "string") return null;
  return {
    id: row.id,
    code: row.code,
    host_name: row.host_name,
    player_count: row.player_count,
    max_players: row.max_players,
    updated_at: row.updated_at,
  };
}

/** Validate an untyped find_word_room() row, or null. */
export function parseWordRoomLookup(row: unknown): WordRoomLookup | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (row.status !== "waiting" && row.status !== "playing" && row.status !== "finished") return null;
  if (typeof row.player_count !== "number" || typeof row.max_players !== "number") return null;
  if (typeof row.updated_at !== "string") return null;
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    player_count: row.player_count,
    max_players: row.max_players,
    updated_at: row.updated_at,
  };
}

/** Validate an untyped list_live_word_rooms() row, or null. */
export function parseLiveWordRoom(row: unknown): WordLiveRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (typeof row.updated_at !== "string") return null;
  if (!Array.isArray(row.players)) return null;
  const players: WordLivePlayer[] = [];
  for (const entry of row.players) {
    if (!isRecord(entry)) return null;
    if (typeof entry.user_id !== "string" || typeof entry.name !== "string") return null;
    if (entry.avatar_url !== null && typeof entry.avatar_url !== "string") return null;
    if (typeof entry.score !== "number" || typeof entry.seat !== "number") return null;
    players.push({
      user_id: entry.user_id,
      name: entry.name,
      avatar_url: entry.avatar_url,
      score: entry.score,
      seat: entry.seat,
    });
  }
  return { id: row.id, code: row.code, updated_at: row.updated_at, players };
}

/** A room stops being joinable/listable after this long without an
    update — the same 1-hour freshness rule as Ludo/Draw & Guess rooms. */
export function isWordRoomFresh(updatedAt: string, nowMs: number): boolean {
  return nowMs - new Date(updatedAt).getTime() < LOBBY_FRESH_MS;
}
