/* Shared Gaming Zone chat types + pure helpers (no I/O).
   Row shapes mirror supabase/add-zone-chat.sql (migration v13) and
   supabase/add-zone-presence.sql (migration v14, in_zone flag).
   Room-code detection reuses the Ludo code alphabet so only real
   Ludo codes are ever linkified — never invent a second scheme. */

import { isValidRoomCode } from "./ludo/room";

export interface ZoneChatMessage {
  id: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  body: string;
  created_at: string;
}

/** One row from the get_live_users() RPC: id + name + pic + last beat +
    whether the user's last heartbeat came from inside the Gaming Zone
    (migration v14). */
export interface LiveUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  last_seen: string | null;
  /** True when the user's last heartbeat path was under /games. */
  in_zone: boolean;
}

/** How many recent messages the chat page loads and keeps. */
export const ZONE_CHAT_LIMIT = 50;

/** Composer limit, matching the body check constraint in migration v13. */
export const ZONE_CHAT_MAX_CHARS = 500;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Validate an untyped Supabase row into a ZoneChatMessage, or null. */
export function parseZoneChatMessage(row: unknown): ZoneChatMessage | null {
  if (!isRecord(row)) return null;
  if (typeof row.id !== "number") return null;
  if (typeof row.user_id !== "string" || typeof row.name !== "string") return null;
  if (typeof row.body !== "string" || typeof row.created_at !== "string") return null;
  if (row.avatar_url !== null && typeof row.avatar_url !== "string") return null;
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    avatar_url: row.avatar_url,
    body: row.body,
    created_at: row.created_at,
  };
}

/** Validate an untyped get_live_users() row into a LiveUser, or null.
    The in_zone flag is optional: rows from before migration v14 carry
    no flag and are treated as not in the zone (empty zone list until
    v14 is applied — never a crash). */
export function parseLiveUser(row: unknown): LiveUser | null {
  if (!isRecord(row)) return null;
  if (typeof row.user_id !== "string" || typeof row.display_name !== "string") return null;
  if (row.avatar_url !== null && typeof row.avatar_url !== "string") return null;
  if (row.last_seen !== null && typeof row.last_seen !== "string") return null;
  return {
    user_id: row.user_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    last_seen: row.last_seen,
    in_zone: row.in_zone === true,
  };
}

/* Room-code detection: scan maximal alphanumeric tokens and keep the ones
   that are exactly 6 characters from the Ludo code alphabet. Tokenising
   (instead of lookarounds) keeps this safe on every browser, and a longer
   word can never match partially — "ABCDEFGH" yields no code. */
const TOKEN_RE = /[A-Za-z0-9]+/g;

/** All distinct Ludo room codes mentioned in a message, in order. */
export function extractRoomCodes(body: string): string[] {
  const found: string[] = [];
  const seen = new Set<string>();
  for (const m of body.matchAll(TOKEN_RE)) {
    const token = m[0].toUpperCase();
    if (token.length === 6 && isValidRoomCode(token) && !seen.has(token)) {
      seen.add(token);
      found.push(token);
    }
  }
  return found;
}

export interface BodySegment {
  text: string;
  /** The room code this segment is, or null for plain text. */
  code: string | null;
}

/** Split a message body into plain-text and room-code segments, so the
    chat can highlight codes inline. Non-code text is returned verbatim. */
export function splitByRoomCodes(body: string): BodySegment[] {
  const segments: BodySegment[] = [];
  let last = 0;
  for (const m of body.matchAll(TOKEN_RE)) {
    const token = m[0].toUpperCase();
    if (token.length !== 6 || !isValidRoomCode(token)) continue;
    const idx = m.index ?? 0;
    if (idx > last) segments.push({ text: body.slice(last, idx), code: null });
    segments.push({ text: body.slice(idx, idx + m[0].length), code: token });
    last = idx + m[0].length;
  }
  if (last < body.length) segments.push({ text: body.slice(last), code: null });
  return segments.length > 0 ? segments : [{ text: body, code: null }];
}
