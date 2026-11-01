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
