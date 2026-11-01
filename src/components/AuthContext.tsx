"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getSupabase,
  isSupabaseConfigured,
  isValidWhatsapp,
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
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

async function fetchOwnProfile(supabase: NonNullable<ReturnType<typeof getSupabase>>, userId: string): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [session, setSession] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

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
      const { data, error } = await supabase.auth.signUp({
        email: syntheticEmail(wa),
        password,
        options: { data: { name: nm, whatsapp: wa } },
      });
      if (error) {
        if (/already registered|already exists/i.test(error.message)) return "exists";
        return "wrong_password";
      }
      const userId = data.user?.id;
      if (!userId) return "wrong_password";
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
        return "wrong_password";
      }
      await refresh();
      return null;
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
      await supabase.from("profiles").delete().eq("id", id);
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
        refresh,
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
