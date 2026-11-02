"use client";

/* Supabase-backed auth for Sweet Smart Calendar.
   - Login/registration with WhatsApp number + password (no Google).
   - Supabase Auth stores credentials; a synthetic email maps each number:
       01797953059  ->  01797953059@sweet-smart-calendar.app
   - The public.profiles table holds name / role / approval status,
     guarded by Row Level Security (see supabase/schema.sql).
   - Works across every device and browser: one shared user database. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UserStatus = "pending" | "approved" | "rejected";
export type UserRole = "super_admin" | "student";

export interface Profile {
  id: string;
  name: string;
  whatsapp: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  gmail?: string | null;
  team_number?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  last_seen?: string | null;
  first_seen?: string | null;
  total_seconds?: number | null;
  full_name?: string | null;
  mobile_number?: string | null;
  date_of_birth?: string | null;
  district?: string | null;
  last_education?: string | null;
  skills_interests?: string | null;
  facebook_link?: string | null;
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(URL && ANON);

let client: SupabaseClient | null = null;

/** Browser Supabase client (session persisted in localStorage by default). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(URL, ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/** WhatsApp number -> synthetic login email. */
export function syntheticEmail(whatsapp: string): string {
  return `${whatsapp.trim()}@sweet-smart-calendar.app`;
}

export function isValidWhatsapp(s: string): boolean {
  return /^01[3-9]\d{8}$/.test(s.trim());
}

export function normalizeWhatsapp(s: string): string {
  return s.trim();
}

/**
 * Cross-tab registration guard. Supabase broadcasts auth events to every open
 * tab of the site; a second tab must not treat a fresh sign-up's not-yet-
 * inserted profile as a deleted account and sign the session out from the
 * shared storage. register() sets this flag (localStorage = shared across
 * tabs, synchronous) for the duration of the sign-up + profile insert.
 */
const SIGNUP_FLAG_KEY = "ssi-signup-in-progress";
const SIGNUP_FLAG_TTL_MS = 60_000;

export function markSignupStart(): void {
  try {
    localStorage.setItem(SIGNUP_FLAG_KEY, String(Date.now()));
  } catch {
    /* storage unavailable: the in-memory ref still guards this tab */
  }
}

export function markSignupEnd(): void {
  try {
    localStorage.removeItem(SIGNUP_FLAG_KEY);
  } catch {
    /* ignore */
  }
}

export function isSignupInProgress(): boolean {
  try {
    const raw = localStorage.getItem(SIGNUP_FLAG_KEY);
    if (!raw) return false;
    return Date.now() - parseInt(raw, 10) < SIGNUP_FLAG_TTL_MS;
  } catch {
    return false;
  }
}
