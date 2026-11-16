/* Shared Ludo room types, room-code generation and pure helpers.
   Supabase calls live in the pages; this file stays free of I/O so the
   board and lobby can share the same shapes. Row shapes mirror
   supabase/add-ludo-gaming-zone.sql (migration v11). */

import type { LudoColor, LudoState } from "./engine";

export type { LudoColor, LudoState };

export interface LudoRoomPlayer {
  user_id: string;
  name: string;
  avatar_url: string | null;
  color: LudoColor;
}

export type LudoRoomStatus = "waiting" | "playing" | "finished";

export interface LudoRoom {
  id: string;
  code: string;
  host_id: string;
  status: LudoRoomStatus;
  max_players: number;
  players: LudoRoomPlayer[];
  state: LudoState | null;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LudoMessage {
  id: number;
  room_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  body: string;
  created_at: string;
}

/** Player colours — identical in light and dark themes. */
export const COLOR_HEX: Record<LudoColor, string> = {
  red: "#E5484D",
  green: "#2FA36B",
  yellow: "#E8A90C",
  blue: "#3E7BFA",
};

/** Softer tint of each player colour, for track / home-column cells. */
export const COLOR_TINT: Record<LudoColor, string> = {
  red: "rgba(229, 72, 77, 0.22)",
  green: "rgba(47, 163, 107, 0.22)",
  yellow: "rgba(232, 169, 12, 0.26)",
  blue: "rgba(62, 123, 250, 0.22)",
};

/** Room codes skip look-alike characters (I, L, O, 0, 1) for easy sharing. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < bytes.length; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

/** Normalise a code typed by a user: trim + uppercase. */
export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidRoomCode(code: string): boolean {
  if (code.length !== ROOM_CODE_LENGTH) return false;
  for (const ch of code) {
    if (!CODE_ALPHABET.includes(ch)) return false;
  }
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLudoColor(value: unknown): value is LudoColor {
  return value === "red" || value === "green" || value === "yellow" || value === "blue";
}

function parsePlayers(value: unknown): LudoRoomPlayer[] | null {
  if (!Array.isArray(value)) return null;
  const players: LudoRoomPlayer[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) return null;
    if (typeof entry.user_id !== "string" || typeof entry.name !== "string") return null;
    if (!isLudoColor(entry.color)) return null;
    if (entry.avatar_url !== null && typeof entry.avatar_url !== "string") return null;
    players.push({
      user_id: entry.user_id,
      name: entry.name,
      avatar_url: entry.avatar_url,
      color: entry.color,
    });
  }
  return players;
}

function parseState(value: unknown): LudoState | null {
  if (value === null || value === undefined) return null;
  if (!isRecord(value) || !Array.isArray(value.players)) return null;
  if (typeof value.turn !== "number" || typeof value.move_no !== "number") return null;
  if (value.phase !== "roll" && value.phase !== "move" && value.phase !== "finished") return null;
  for (const p of value.players) {
    if (!isRecord(p) || !isLudoColor(p.color) || !Array.isArray(p.tokens)) return null;
    if (p.tokens.length !== 4) return null;
    for (const tok of p.tokens) {
      if (typeof tok !== "number") return null;
    }
  }
  return value as unknown as LudoState;
}

/** Validate an untyped Supabase row into a LudoRoom, or null if malformed. */
export function parseRoom(row: unknown): LudoRoom | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "string" || typeof row.code !== "string") return null;
  if (typeof row.host_id !== "string") return null;
  if (row.status !== "waiting" && row.status !== "playing" && row.status !== "finished") return null;
  if (typeof row.max_players !== "number") return null;
  const players = parsePlayers(row.players);
  if (!players) return null;
  const state = parseState(row.state);
  if (row.state !== null && row.state !== undefined && state === null) return null;
  if (row.winner_id !== null && typeof row.winner_id !== "string") return null;
  if (typeof row.created_at !== "string" || typeof row.updated_at !== "string") return null;
  return {
    id: row.id,
    code: row.code,
    host_id: row.host_id,
    status: row.status,
    max_players: row.max_players,
    players,
    state,
    winner_id: row.winner_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function parseMessage(row: unknown): LudoMessage | null {
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

/** Index of a user inside the seating order, or -1 when not seated. */
export function seatIndex(room: LudoRoom, userId: string): number {
  return room.players.findIndex((p) => p.user_id === userId);
}

/** A waiting room stops being joinable from the lobby after this long. */
export const LOBBY_FRESH_MS = 60 * 60 * 1000;

export function isRoomFresh(room: LudoRoom, nowMs: number): boolean {
  return nowMs - new Date(room.updated_at).getTime() < LOBBY_FRESH_MS;
}
