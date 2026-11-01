"use client";

/* Local auth: name + WhatsApp + password registration, super-admin approval.
   Everything lives in this browser's localStorage — no server, no Google.
   Passwords are stored as salted SHA-256 hashes, never plaintext. */

export type UserStatus = "pending" | "approved" | "rejected";
export type UserRole = "super_admin" | "student";

export interface AuthUser {
  id: string;
  name: string;
  whatsapp: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

const USERS_KEY = "ssc-users";
const SESSION_KEY = "ssc-session";

const ADMIN_WHATSAPP = "01797953059";
/* SHA-256("ssc-admin-v1:01797953059:<admin password>"), precomputed off-repo.
   The plaintext password never appears in this codebase. */
const ADMIN_SEED_HASH =
  "146a977c0cfea9d9355acad61e3f60d63da6691671981ca32457105b634d543f";

export function isValidWhatsapp(s: string): boolean {
  return /^01[3-9]\d{8}$/.test(s.trim());
}

export function normalizeWhatsapp(s: string): string {
  return s.trim();
}

export async function hashPassword(whatsapp: string, password: string): Promise<string> {
  if (!window.crypto?.subtle) {
    throw new Error("Secure crypto unavailable");
  }
  const data = new TextEncoder().encode(`ssc-admin-v1:${whatsapp}:${password}`);
  const buf = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeUsers(users: AuthUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    /* storage full or blocked — auth degrades gracefully */
  }
}

/** Create the super-admin account on first run. Idempotent. */
export function ensureSeeded(): AuthUser[] {
  const users = readUsers();
  if (!users.some((u) => u.role === "super_admin")) {
    const admin: AuthUser = {
      id: "admin-seed-1",
      name: "Sonet",
      whatsapp: ADMIN_WHATSAPP,
      passwordHash: ADMIN_SEED_HASH,
      role: "super_admin",
      status: "approved",
      createdAt: new Date().toISOString(),
    };
    const next = [admin, ...users];
    writeUsers(next);
    return next;
  }
  return users;
}

export function loadUsers(): AuthUser[] {
  return ensureSeeded();
}

export function saveUsers(users: AuthUser[]): void {
  writeUsers(users);
}

export function loadSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveSessionId(id: string | null): void {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function newUserId(): string {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
