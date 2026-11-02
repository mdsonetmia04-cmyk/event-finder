"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  getSupabase,
  isSupabaseConfigured,
  isSignupInProgress,
  isValidWhatsapp,
  markSignupEnd,
  markSignupStart,
  normalizeWhatsapp,
  syntheticEmail,
  type Profile,
} from "@/lib/supabase";

export type AuthError =
  | "not_configured"
  | "invalid_whatsapp"
  | "password_short"
  | "name_required"
  | "exists"
  | "no_user"
  | "wrong_password"
  | "signup_failed"
  | null;

interface AuthCtx {
  ready: boolean;
  configured: boolean;
  users: Profile[];
  session: Profile | null;
  login: (whatsapp: string, password: string) => Promise<AuthError>;
  register: (name: string, whatsapp: string, password: string) => Promise<AuthError>;
  logout: () => void;
  approve: (id: string) => void;
  reject: (id: string) => void;
  removeUser: (id: string) => void;
  changePassword: (newPassword: string) => Promise<AuthError>;
  refreshUsers: () => Promise<void>;
  updateProfile: (fields: {
    gmail: string;
    team_number: string;
    gender: string;
    blood_group: string;
    full_name: string;
    mobile_number: string;
    date_of_birth: string;
    district: string;
    last_education: string;
    skills_interests: string;
    facebook_link: string;
  }) => Promise<"ok" | "not_ready" | "error">;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

async function fetchOwnProfile(supabase: NonNullable<ReturnType<typeof getSupabase>>, userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

/**
 * Heal an orphan auth account: signUp said "already registered" but no profile
 * row exists (e.g. an earlier registration was interrupted before the insert).
 * If the given password unlocks that account, finish creating its profile.
 * Returns "ok" when healed, "no" otherwise (session left signed out).
 */
async function healOrphanProfile(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  wa: string,
  name: string,
  password: string
): Promise<"ok" | "no"> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail(wa),
    password,
  });
  if (error || !data.user) return "no";
  const existing = await fetchOwnProfile(supabase, data.user.id);
  if (existing) {
    // Genuinely taken by someone else: do not stay signed in as them.
    await supabase.auth.signOut();
    return "no";
  }
  const { error: pErr } = await supabase.from("profiles").insert({
    id: data.user.id,
    name,
    whatsapp: wa,
    role: "student",
    status: "pending",
  });
  if (pErr) {
    await supabase.auth.signOut();
    return "no";
  }
  return "ok";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [session, setSession] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  // True while register() is running. Supabase fires SIGNED_IN as soon as
  // signUp succeeds — before the profile row is inserted — and the listener
  // below must NOT treat that as a deleted account and sign out.
  const signingUpRef = useRef(false);

  const loadAll = useCallback(async (isAdmin: boolean) => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (isAdmin) {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers((data as Profile[]) ?? []);
    } else {
      setUsers([]);
    }
  }, []);

  const syncFromSession = useCallback(
    async (userId: string | null) => {
      const supabase = getSupabase();
      if (!supabase || !userId) {
        setSession(null);
        setUsers([]);
        return;
      }
      const profile = await fetchOwnProfile(supabase, userId);
      if (!profile) {
        // A fresh sign-up's profile row is inserted just after the SIGNED_IN
        // event; keep the session while register() finishes its work. The
        // localStorage flag covers other open tabs (Supabase broadcasts auth
        // events cross-tab, and storage is shared).
        if (signingUpRef.current || isSignupInProgress()) return;
        // Account deleted by admin (or profile missing): sign out.
        await supabase.auth.signOut();
        setSession(null);
        setUsers([]);
        return;
      }
      setSession(profile);
      await loadAll(profile.role === "super_admin");
    },
    [loadAll]
  );

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      await syncFromSession(data.session?.user.id ?? null);
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      await syncFromSession(sess?.user.id ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [syncFromSession]);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    await syncFromSession(data.session?.user.id ?? null);
  }, [syncFromSession]);

  /** Reload the full user list (super admin only) — used to refresh presence stats. */
  const refreshUsers = useCallback(async () => {
    if (session?.role === "super_admin") await loadAll(true);
  }, [session?.role, loadAll]);

  // Presence heartbeat: while logged in, tell the DB we're active every 60s.
  // The heartbeat() RPC accumulates total_seconds (capped per beat) and stamps
  // last_seen, which the admin panel uses for "live now" + usage time.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    let alive = true;
    const beat = () => {
      if (!alive) return;
      supabase.rpc("heartbeat").then(() => {});
    };
    beat();
    const timer = setInterval(beat, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [session?.id]);

  const login = useCallback(
    async (whatsapp: string, password: string): Promise<AuthError> => {
      const supabase = getSupabase();
      if (!supabase) return "not_configured";
      const wa = normalizeWhatsapp(whatsapp);
      if (!isValidWhatsapp(wa)) return "invalid_whatsapp";
      // Distinguish "no account" from "wrong password" without leaking the table.
      const { data: registered } = await supabase.rpc("whatsapp_registered", { wa });
      if (!registered) return "no_user";
      const { error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail(wa),
        password,
      });
      if (error) return "wrong_password";
      await refresh();
      return null;
    },
    [refresh]
  );

  const register = useCallback(
    async (name: string, whatsapp: string, password: string): Promise<AuthError> => {
      const supabase = getSupabase();
      if (!supabase) return "not_configured";
      const nm = name.trim();
      const wa = normalizeWhatsapp(whatsapp);
      if (!nm) return "name_required";
      if (!isValidWhatsapp(wa)) return "invalid_whatsapp";
      if (password.length < 6) return "password_short";
      const { data: registered } = await supabase.rpc("whatsapp_registered", { wa });
      if (registered) return "exists";
      // Guard the fresh session: the auth-state listener must not sign it out
      // before the profile row below is inserted (see signingUpRef + the
      // cross-tab flag in lib/supabase.ts).
      signingUpRef.current = true;
      markSignupStart();
      try {
        const { data, error } = await supabase.auth.signUp({
          email: syntheticEmail(wa),
          password,
          options: { data: { name: nm, whatsapp: wa } },
        });
        if (error) {
          if (/already registered|already exists/i.test(error.message)) {
            // Orphan from an interrupted registration? Finish it when possible.
            const healed = await healOrphanProfile(supabase, wa, nm, password);
            if (healed === "ok") {
              await refresh();
              return null;
            }
            return "exists";
          }
          return "signup_failed";
        }
        const userId = data.user?.id;
        if (!userId) return "signup_failed";
        const { error: pErr } = await supabase.from("profiles").insert({
          id: userId,
          name: nm,
          whatsapp: wa,
          role: "student",
          status: "pending",
        });
        if (pErr) {
          // Profile insert failed (e.g. RLS): clean up the auth user record attempt.
          await supabase.auth.signOut();
          return "signup_failed";
        }
        await refresh();
        return null;
      } finally {
        signingUpRef.current = false;
        markSignupEnd();
      }
    },
    [refresh]
  );

  const logout = useCallback(() => {
    const supabase = getSupabase();
    if (supabase) void supabase.auth.signOut();
    setSession(null);
    setUsers([]);
  }, []);

  const setStatus = useCallback(
    async (id: string, status: Profile["status"]) => {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.from("profiles").update({ status }).eq("id", id);
      await loadAll(true);
    },
    [loadAll]
  );

  const approve = useCallback((id: string) => void setStatus(id, "approved"), [setStatus]);
  const reject = useCallback((id: string) => void setStatus(id, "rejected"), [setStatus]);

  const removeUser = useCallback(
    async (id: string) => {
      const supabase = getSupabase();
      if (!supabase) return;
      // Full removal: the admin_delete_user RPC deletes the auth user too
      // (profile cascades), so the number can register again cleanly.
      const { error } = await supabase.rpc("admin_delete_user", { target_id: id });
      if (error) {
        // Fallback: remove the profile row at least.
        await supabase.from("profiles").delete().eq("id", id);
      }
      await loadAll(true);
    },
    [loadAll]
  );

  const changePassword = useCallback(async (newPassword: string): Promise<AuthError> => {
    const supabase = getSupabase();
    if (!supabase) return "not_configured";
    if (newPassword.length < 6) return "password_short";
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? "wrong_password" : null;
  }, []);

  /** Update the caller's own optional profile fields via the
      update_own_profile RPC. Returns "not_ready" when the DB migration
      (supabase/add-profile-fields-2.sql) has not been run yet. */
  const updateProfile = useCallback(
    async (fields: {
      gmail: string;
      team_number: string;
      gender: string;
      blood_group: string;
      full_name: string;
      mobile_number: string;
      date_of_birth: string;
      district: string;
      last_education: string;
      skills_interests: string;
      facebook_link: string;
    }) => {
      const supabase = getSupabase();
      if (!supabase) return "error" as const;
      const { error } = await supabase.rpc("update_own_profile", {
        p_gmail: fields.gmail.trim(),
        p_team_number: fields.team_number.trim(),
        p_gender: fields.gender,
        p_blood_group: fields.blood_group,
        p_full_name: fields.full_name.trim(),
        p_mobile_number: fields.mobile_number.trim(),
        p_date_of_birth: fields.date_of_birth.trim(),
        p_district: fields.district.trim(),
        p_last_education: fields.last_education.trim(),
        p_skills_interests: fields.skills_interests.trim(),
        p_facebook_link: fields.facebook_link.trim(),
      });
      if (error) {
        // 42883 = undefined_function → migration not run yet
        return (error as { code?: string }).code === "42883" ? ("not_ready" as const) : ("error" as const);
      }
      await refresh();
      return "ok" as const;
    },
    [refresh]
  );

  return (
    <Ctx.Provider
      value={{
        ready,
        configured: isSupabaseConfigured,
        users,
        session,
        login,
        register,
        logout,
        approve,
        reject,
        removeUser,
        changePassword,
        updateProfile,
        refresh,
        refreshUsers,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
