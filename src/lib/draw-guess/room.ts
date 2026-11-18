/* Shared Draw & Guess room types + pure helpers (no I/O).
   Row shapes mirror supabase/add-draw-guess.sql (migration v16) as
   returned by the get_draw_room() RPC — the only read path, since
   direct SELECT on draw_rooms is denied so the current word can never
   reach guessers. Room codes reuse the Ludo scheme (same alphabet,
   generation and validation) — never invent a second scheme. */

import { LOBBY_FRESH_MS } from "../ludo/room";

export type DrawRoomStatus = "waiting" | "playing" | "finished";

export type DrawPhase = "picking" | "drawing" | "reveal";

export interface DrawPlayer {
  user_id: string;
  name: string;
  avatar_url: string | null;
  score: number;
  has_guessed: boolean;
  /** Drawing order: 0 draws first, then 1, 2, … */
  seat: number;
}

export interface DrawRoom {
  id: string;
  code: string;
  host_id: string;
  status: DrawRoomStatus;
  max_players: number;
  /** Null while waiting/finished; picking/drawing/reveal while playing. */
  phase: DrawPhase | null;
  current_drawer_id: string | null;
  /** The secret word: present ONLY for the drawer (or everyone during
      reveal) — get_draw_room() hides it from everyone else. */
  current_word: string | null;
  /** Masked word shape ("___ _____") for guessers during drawing. */
  word_hint: string | null;
  /** Words already drawn this game: drawer-only, for picking choices. */
  used_words: string[];
  round_no: number;
  max_rounds: number;
  /** Deadline of the current phase (pick 30s / draw 60s / reveal 6s). */
  round_ends_at: string | null;
  created_at: string;
  updated_at: string;
  players: DrawPlayer[];
}

/** Phase lengths in seconds — mirror the migration v16 intervals. The
    server is authoritative (round_ends_at); these only size the
    client-side countdown bar. */
export const DRAW_PICK_SECONDS = 30;
export const DRAW_ROUND_SECONDS = 60;
export const DRAW_REVEAL_SECONDS = 6;

/** One row from the list_draw_rooms() RPC: safe lobby fields only. */
export interface DrawLobbyRoom {
  id: string;
  code: string;
  host_name: string | null;
  player_count: number;
  max_players: number;
  updated_at: string;
}

/** One row from the find_draw_room() RPC (join-by-code + chat chips). */
export interface DrawRoomLookup {
  id: string;
  code: string;
  status: DrawRoomStatus;
  player_count: number;
  max_players: number;
  updated_at: string;
}

/** One player row inside a list_live_draw_rooms() result: the same
    spectator-safe fields get_draw_room() already exposes to
    non-members — name, avatar, score, seat. No word, ever. */
export interface DrawLivePlayer {
  user_id: string;
  name: string;
  avatar_url: string | null;
  score: number;
  seat: number;
}

/** One row from the list_live_draw_rooms() RPC (migration v24): a
    playing room for the /games/live spectator list. */
export interface DrawLiveRoom {
  id: string;
  code: string;
  updated_at: string;
  players: DrawLivePlayer[];
}

/** One row of the per-room chat — mirrors ludo_messages (migration
    v11). Row shape mirrors supabase/add-draw-chat.sql (migration v21):
    the sender's name/avatar are snapshotted at send time. */
export interface DrawMessage {
  id: number;
  room_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  body: string;
  created_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePlayers(value: unknown): DrawPlayer[] | null {
  if (!Array.isArray(value)) return null;
  const players: DrawPlayer[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    if (typeof entry.user_id !== "string" || typeof entry.name !== "string") return null;
    if (entry.avatar_url !== null && typeof entry.avatar_url !== "string") return null;
    if (typeof entry.score !== "number" || typeof entry.has_guessed !== "boolean") return null;
    if (typeof entry.seat !== "number") return null;
    players.push({
      user_id: entry.user_id,
      name: entry.name,
      avatar_url: entry.avatar_url,
      score: entry.score,
      has_guessed: entry.has_guessed,
      seat: entry.seat,
    });
  }
  return players;
}

/** Validate an untyped get_draw_room() result into a DrawRoom, or null. */
export function parseDrawRoom(row: unknown): DrawRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (typeof row.host_id !== "string") return null;
  if (row.status !== "waiting" && row.status !== "playing" && row.status !== "finished") return null;
  if (typeof row.max_players !== "number") return null;
  if (row.phase !== null && row.phase !== "picking" && row.phase !== "drawing" && row.phase !== "reveal") {
    return null;
  }
  if (row.current_drawer_id !== null && typeof row.current_drawer_id !== "string") return null;
  if (row.current_word !== null && typeof row.current_word !== "string") return null;
  if (row.word_hint !== null && typeof row.word_hint !== "string") return null;
  if (!Array.isArray(row.used_words) || row.used_words.some((w) => typeof w !== "string")) return null;
  if (typeof row.round_no !== "number" || typeof row.max_rounds !== "number") return null;
  if (row.round_ends_at !== null && typeof row.round_ends_at !== "string") return null;
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
    current_drawer_id: row.current_drawer_id,
    current_word: row.current_word,
    word_hint: row.word_hint,
    used_words: [...row.used_words],
    round_no: row.round_no,
    max_rounds: row.max_rounds,
    round_ends_at: row.round_ends_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    players,
  };
}

/** Validate an untyped list_draw_rooms() row, or null. */
export function parseDrawLobbyRoom(row: unknown): DrawLobbyRoom | null {
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

/** Validate an untyped find_draw_room() row, or null. */
export function parseDrawRoomLookup(row: unknown): DrawRoomLookup | null {
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

/** Validate an untyped list_live_draw_rooms() row, or null. */
export function parseLiveDrawRoom(row: unknown): DrawLiveRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (typeof row.updated_at !== "string") return null;
  if (!Array.isArray(row.players)) return null;
  const players: DrawLivePlayer[] = [];
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

/** Validate an untyped draw_messages row (initial load or realtime
    payload) into a DrawMessage, or null if malformed. */
export function parseDrawMessage(row: unknown): DrawMessage | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "number" || typeof row.room_id !== "string") return null;
  if (typeof row.user_id !== "string" || typeof row.name !== "string") return null;
  if (typeof row.body !== "string" || typeof row.created_at !== "string") return null;
  if (row.avatar_url !== null && typeof row.avatar_url !== "string") return null;
  return {
    id: row.id,
    room_id: row.room_id,
    user_id: row.user_id,
    name: row.name,
    avatar_url: row.avatar_url,
    body: row.body,
    created_at: row.created_at,
  };
}

/** A room stops being joinable/listable after this long without an
    update — the same 1-hour freshness rule as Ludo rooms. */
export function isDrawRoomFresh(updatedAt: string, nowMs: number): boolean {
  return nowMs - new Date(updatedAt).getTime() < LOBBY_FRESH_MS;
}

/** The player currently drawing, if any. */
export function drawerOf(room: DrawRoom): DrawPlayer | undefined {
  return room.players.find((p) => p.user_id === room.current_drawer_id);
}

/** Index of a user inside the seating order, or -1 when not seated. */
export function drawSeatIndex(room: DrawRoom, userId: string): number {
  return room.players.findIndex((p) => p.user_id === userId);
}
