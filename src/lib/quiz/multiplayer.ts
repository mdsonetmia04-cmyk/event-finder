/* Shared Multiplayer Quiz Battle room types + pure helpers (no I/O).
   Row shapes mirror supabase/add-quiz-multiplayer.sql (migration v27)
   as returned by the get_quiz_room() RPC — the only read path, since
   direct SELECT on quiz_rooms is denied so the correct answers (held
   server-side in correct_indices) can never reach a client before a
   question's reveal. Room codes reuse the Ludo scheme (same alphabet,
   generation and validation) — never invent a second scheme.
   Questions come from the verified 1,500-question banks
   (src/lib/quiz/levels-*.ts); the host's client draws 10 for a match
   and the server stores their ids, shuffled option orders and correct
   display indices. */

import { LOBBY_FRESH_MS } from "../ludo/room";
import { ALL_LEVEL_QUESTIONS } from "./levels";
import { correctDisplayIndex, type BattleQuestion, type QuizQuestion } from "./adobe-stock-questions";

export type QuizRoomStatus = "waiting" | "playing" | "finished";

export type QuizPhase = "question" | "reveal";

export interface QuizPlayer {
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

export interface QuizRevealAnswer {
  user_id: string;
  picked: number;
  correct: boolean;
  ms: number;
}

export interface QuizReveal {
  /** Correct DISPLAY index (0..3) for the current question. */
  correct: number;
  answers: QuizRevealAnswer[];
}

export interface QuizAnswer {
  user_id: string;
  q_index: number;
  picked: number;
  correct: boolean;
  ms: number;
}

export interface QuizRoom {
  id: string;
  code: string;
  host_id: string;
  status: QuizRoomStatus;
  max_players: number;
  /** Null while waiting/finished; question/reveal while playing. */
  phase: QuizPhase | null;
  /** Current question index (0..9). */
  current_q: number;
  /** Current question's bank id — playing only, null otherwise. */
  question_id: string | null;
  /** Current question's display order — playing only, null otherwise. */
  question_order: number[] | null;
  /** Reveal payload — present only while phase = 'reveal'. */
  reveal: QuizReveal | null;
  /** Deadline of the current phase (question 15s / reveal 8s). */
  question_ends_at: string | null;
  /** Full question list — finished rooms only (review). */
  question_ids: string[];
  question_orders: number[][];
  /** Every answer — finished rooms only (review). */
  all_answers: QuizAnswer[];
  created_at: string;
  updated_at: string;
  players: QuizPlayer[];
}

/** One row from the list_quiz_rooms() RPC: safe lobby fields only. */
export interface QuizLobbyRoom {
  id: string;
  code: string;
  host_name: string | null;
  player_count: number;
  max_players: number;
  updated_at: string;
}

/** One row from the find_quiz_room() RPC (join-by-code). */
export interface QuizRoomLookup {
  id: string;
  code: string;
  status: QuizRoomStatus;
  player_count: number;
  max_players: number;
  updated_at: string;
}

/** One player row inside a list_live_quiz_rooms() result: the same
    spectator-safe fields get_quiz_room() already exposes to
    non-members — name, avatar, score, seat. No question, ever. */
export interface QuizLivePlayer {
  user_id: string;
  name: string;
  avatar_url: string | null;
  score: number;
  seat: number;
}

/** One row from the list_live_quiz_rooms() RPC (migration v27): a
    playing room for the /games/live spectator list. */
export interface QuizLiveRoom {
  id: string;
  code: string;
  updated_at: string;
  players: QuizLivePlayer[];
}

/** Match constants — mirror the migration v27 intervals. The server is
    authoritative (question_ends_at); these only size the client-side
    countdown bar. */
export const QUIZ_MATCH_QUESTIONS = 10;
export const QUIZ_QUESTION_MS = 15000;
export const QUIZ_REVEAL_MS = 8000;
export const QUIZ_MIN_PLAYERS = 2;
export const QUIZ_MAX_PLAYERS = 4;

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

/** The 1,500 bank questions, flattened once and indexed by id. */
let flatBank: QuizQuestion[] | null = null;
let bankById: Map<string, QuizQuestion> | null = null;

function getBank(): { flat: QuizQuestion[]; byId: Map<string, QuizQuestion> } {
  if (!flatBank || !bankById) {
    flatBank = Object.values(ALL_LEVEL_QUESTIONS).flat();
    bankById = new Map(flatBank.map((q) => [q.id, q]));
  }
  return { flat: flatBank, byId: bankById };
}

export interface MatchDraw {
  /** Bank ids in match order. */
  ids: string[];
  /** Shuffled display order per question (display pos -> option idx). */
  orders: number[][];
  /** Correct DISPLAY index per question (what the server stores). */
  correct: number[];
  /** The drawn questions, for the host's own play. */
  questions: BattleQuestion[];
}

/** Draw a match's 10 questions: random across all 1,500 bank
    questions, each with its own shuffled option order. Called by the
    HOST's client only; the draw is sent to start_quiz_game() so every
    player in the room sees the same 10 questions in the same order. */
export function drawMatchQuestions(): MatchDraw {
  const { flat } = getBank();
  const picked = shuffled(flat).slice(0, QUIZ_MATCH_QUESTIONS);
  const questions: BattleQuestion[] = picked.map((question) => ({
    question,
    order: shuffled([0, 1, 2, 3]),
  }));
  return {
    ids: questions.map((bq) => bq.question.id),
    orders: questions.map((bq) => bq.order),
    correct: questions.map((bq) => correctDisplayIndex(bq)),
    questions,
  };
}

/** Resolve a room question (bank id + display order from the RPC) to a
    BattleQuestion for rendering. Null when the id is not in the bank
    (a stale client after a bank edit). */
export function resolveMatchQuestion(id: string, order: number[]): BattleQuestion | null {
  const { byId } = getBank();
  const question = byId.get(id);
  if (!question) return null;
  if (order.length !== 4 || order.some((n) => n < 0 || n > 3)) return null;
  return { question, order: [...order] };
}

/** Rank players for the scoreboard: most marks first; a marks tie goes
    to the fastest TOTAL answer time; a full tie falls back to seat. */
export function rankQuizPlayers(players: QuizPlayer[]): QuizPlayer[] {
  return [...players].sort(
    (a, b) => b.score - a.score || a.total_ms - b.total_ms || a.seat - b.seat,
  );
}

/** Index of a user inside the seating order, or -1 when not seated. */
export function quizSeatIndex(room: QuizRoom, userId: string): number {
  return room.players.findIndex((p) => p.user_id === userId);
}

function parseQuizPlayer(entry: unknown): QuizPlayer | null {
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

function parsePlayers(value: unknown): QuizPlayer[] | null {
  if (!Array.isArray(value)) return null;
  const players: QuizPlayer[] = [];
  for (const entry of value) {
    const p = parseQuizPlayer(entry);
    if (!p) return null;
    players.push(p);
  }
  return players;
}

function parseReveal(value: unknown): QuizReveal | null {
  if (value === null) return null;
  if (!isRecord(value)) return null;
  if (typeof value.correct !== "number" || value.correct < 0 || value.correct > 3) return null;
  if (!Array.isArray(value.answers)) return null;
  const answers: QuizRevealAnswer[] = [];
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

function parseAllAnswers(value: unknown): QuizAnswer[] | null {
  if (!Array.isArray(value)) return null;
  const answers: QuizAnswer[] = [];
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

/** Validate an untyped get_quiz_room() result into a QuizRoom, or null. */
export function parseQuizRoom(row: unknown): QuizRoom | null {
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

/** Validate an untyped list_quiz_rooms() row, or null. */
export function parseQuizLobbyRoom(row: unknown): QuizLobbyRoom | null {
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

/** Validate an untyped find_quiz_room() row, or null. */
export function parseQuizRoomLookup(row: unknown): QuizRoomLookup | null {
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

/** Validate an untyped list_live_quiz_rooms() row, or null. */
export function parseLiveQuizRoom(row: unknown): QuizLiveRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (typeof row.updated_at !== "string") return null;
  if (!Array.isArray(row.players)) return null;
  const players: QuizLivePlayer[] = [];
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
export function isQuizRoomFresh(updatedAt: string, nowMs: number): boolean {
  return nowMs - new Date(updatedAt).getTime() < LOBBY_FRESH_MS;
}
