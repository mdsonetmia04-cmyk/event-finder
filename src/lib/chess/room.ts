/* Shared Chess room types + pure helpers (no I/O).
   Row shapes mirror supabase/add-chess.sql (migration v23) as
   returned by the get_chess_room() RPC — the only read path that
   joins seats to the room. Room codes reuse the Ludo scheme (same
   alphabet, generation and validation) — never invent a second
   scheme. Chess has no hidden state (unlike Draw & Guess), so
   spectators may read the board freely; writes still go through
   SECURITY DEFINER RPCs only. */

import { LOBBY_FRESH_MS } from "../ludo/room";

export type ChessRoomStatus = "waiting" | "playing" | "finished";

/** How a finished game ended. 'draw' covers the three automatic
    draws the client reports (insufficient material, threefold
    repetition, fifty-move rule) — the specific kind is stored in
    `result` when known; all three are draws. */
export type ChessResultKind =
  | "checkmate"
  | "stalemate"
  | "insufficient"
  | "threefold"
  | "fifty"
  | "resign"
  | "draw_agreement";

/** One recorded move: enough to replay the game and render history. */
export interface ChessMoveRecord {
  from: string;
  to: string;
  promotion: string | null;
  san: string;
}

export interface ChessPlayer {
  user_id: string;
  name: string;
  avatar_url: string | null;
  /** 0 = White (first seat), 1 = Black. */
  seat: number;
}

export interface ChessRoom {
  id: string;
  code: string;
  host_id: string;
  /** Seat 0 (White). Null only for an emptied waiting room. */
  white_id: string | null;
  /** Seat 1 (Black). Null while waiting for an opponent. */
  black_id: string | null;
  status: ChessRoomStatus;
  /** Current position (FEN). Start position while waiting. */
  fen: string;
  moves: ChessMoveRecord[];
  result: ChessResultKind | null;
  winner_id: string | null;
  /** User id of the player who offered a draw, or null. */
  draw_offer_by: string | null;
  created_at: string;
  updated_at: string;
  players: ChessPlayer[];
}

/** One row from the list_chess_rooms() RPC: safe lobby fields only. */
export interface ChessLobbyRoom {
  id: string;
  code: string;
  host_name: string | null;
  player_count: number;
  status: ChessRoomStatus;
  updated_at: string;
}

/** One row from the find_chess_room() RPC (join-by-code). */
export interface ChessRoomLookup {
  id: string;
  code: string;
  status: ChessRoomStatus;
  player_count: number;
  updated_at: string;
}

/** One row of the per-room chat — mirrors draw_messages (migration
    v21). Row shape mirrors supabase/add-chess.sql (migration v23):
    the sender's name/avatar are snapshotted at send time. */
export interface ChessMessage {
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

function parseMoves(value: unknown): ChessMoveRecord[] | null {
  if (!Array.isArray(value)) return null;
  const moves: ChessMoveRecord[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    if (typeof entry.from !== "string" || typeof entry.to !== "string") return null;
    if (typeof entry.san !== "string") return null;
    if (entry.promotion !== null && typeof entry.promotion !== "string") return null;
    moves.push({ from: entry.from, to: entry.to, promotion: entry.promotion, san: entry.san });
  }
  return moves;
}

function parsePlayers(value: unknown): ChessPlayer[] | null {
  if (!Array.isArray(value)) return null;
  const players: ChessPlayer[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    if (typeof entry.user_id !== "string" || typeof entry.name !== "string") return null;
    if (entry.avatar_url !== null && typeof entry.avatar_url !== "string") return null;
    if (typeof entry.seat !== "number") return null;
    players.push({ user_id: entry.user_id, name: entry.name, avatar_url: entry.avatar_url, seat: entry.seat });
  }
  return players;
}

function isResultKind(value: unknown): value is ChessResultKind {
  return (
    value === "checkmate" ||
    value === "stalemate" ||
    value === "insufficient" ||
    value === "threefold" ||
    value === "fifty" ||
    value === "resign" ||
    value === "draw_agreement"
  );
}

/** Validate an untyped get_chess_room() result into a ChessRoom, or null. */
export function parseChessRoom(row: unknown): ChessRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (typeof row.host_id !== "string") return null;
  if (row.white_id !== null && typeof row.white_id !== "string") return null;
  if (row.black_id !== null && typeof row.black_id !== "string") return null;
  if (row.status !== "waiting" && row.status !== "playing" && row.status !== "finished") return null;
  if (typeof row.fen !== "string") return null;
  const moves = parseMoves(row.moves);
  if (!moves) return null;
  if (row.result !== null && !isResultKind(row.result)) return null;
  if (row.winner_id !== null && typeof row.winner_id !== "string") return null;
  if (row.draw_offer_by !== null && typeof row.draw_offer_by !== "string") return null;
  if (typeof row.created_at !== "string" || typeof row.updated_at !== "string") return null;
  const players = parsePlayers(row.players);
  if (!players) return null;
  return {
    id: row.id,
    code: row.code,
    host_id: row.host_id,
    white_id: row.white_id,
    black_id: row.black_id,
    status: row.status,
    fen: row.fen,
    moves,
    result: row.result,
    winner_id: row.winner_id,
    draw_offer_by: row.draw_offer_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    players,
  };
}

/** Validate an untyped list_chess_rooms() row, or null. */
export function parseChessLobbyRoom(row: unknown): ChessLobbyRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (row.host_name !== null && typeof row.host_name !== "string") return null;
  if (typeof row.player_count !== "number") return null;
  if (row.status !== "waiting" && row.status !== "playing" && row.status !== "finished") return null;
  if (typeof row.updated_at !== "string") return null;
  return {
    id: row.id,
    code: row.code,
    host_name: row.host_name,
    player_count: row.player_count,
    status: row.status,
    updated_at: row.updated_at,
  };
}

/** Validate an untyped find_chess_room() row, or null. */
export function parseChessRoomLookup(row: unknown): ChessRoomLookup | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (row.status !== "waiting" && row.status !== "playing" && row.status !== "finished") return null;
  if (typeof row.player_count !== "number") return null;
  if (typeof row.updated_at !== "string") return null;
  return { id: row.id, code: row.code, status: row.status, player_count: row.player_count, updated_at: row.updated_at };
}

/** Validate an untyped chess_messages row (initial load or realtime
    payload) into a ChessMessage, or null if malformed. */
export function parseChessMessage(row: unknown): ChessMessage | null {
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
export function isChessRoomFresh(updatedAt: string, nowMs: number): boolean {
  return nowMs - new Date(updatedAt).getTime() < LOBBY_FRESH_MS;
}

/** Seat (0 = White, 1 = Black) of a user, or -1 when not seated. */
export function chessSeatOf(room: ChessRoom, userId: string): number {
  const player = room.players.find((p) => p.user_id === userId);
  return player ? player.seat : -1;
}
