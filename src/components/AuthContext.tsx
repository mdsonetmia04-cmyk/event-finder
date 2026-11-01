"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ensureSeeded,
  hashPassword,
  isValidWhatsapp,
  loadSessionId,
  newUserId,
  normalizeWhatsapp,
  saveSessionId,
  saveUsers,
  type AuthUser,
} from "@/lib/auth";

export type AuthError =
  | "invalid_whatsapp"
  | "password_short"
  | "name_required"
  | "exists"
  | "no_user"
  | "wrong_password"
  | null;

interface AuthCtx {
  ready: boolean;
  users: AuthUser[];
  session: AuthUser | null;
  login: (whatsapp: string, password: string) => Promise<AuthError>;
  register: (name: string, whatsapp: string, password: string) => Promise<AuthError>;
  logout: () => void;
  approve: (id: string) => void;
  reject: (id: string) => void;
  removeUser: (id: string) => void;
  changePassword: (newPassword: string) => Promise<AuthError>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUsers(ensureSeeded());
    setSessionId(loadSessionId());
    setReady(true);
  }, []);

  const persist = useCallback((next: AuthUser[]) => {
    setUsers(next);
    saveUsers(next);
  }, []);

  const session = useMemo(
    () => users.find((u) => u.id === sessionId) ?? null,
    [users, sessionId]
  );

  const login = useCallback(
    async (whatsapp: string, password: string): Promise<AuthError> => {
      const wa = normalizeWhatsapp(whatsapp);
      if (!isValidWhatsapp(wa)) return "invalid_whatsapp";
      const user = users.find((u) => u.whatsapp === wa);
      if (!user) return "no_user";
      const hash = await hashPassword(wa, password);
      if (hash !== user.passwordHash) return "wrong_password";
      setSessionId(user.id);
      saveSessionId(user.id);
      return null;
    },
    [users]
  );

  const register = useCallback(
    async (name: string, whatsapp: string, password: string): Promise<AuthError> => {
      const nm = name.trim();
      const wa = normalizeWhatsapp(whatsapp);
      if (!nm) return "name_required";
      if (!isValidWhatsapp(wa)) return "invalid_whatsapp";
      if (password.length < 6) return "password_short";
      if (users.some((u) => u.whatsapp === wa)) return "exists";
      const hash = await hashPassword(wa, password);
      const user: AuthUser = {
        id: newUserId(),
        name: nm,
        whatsapp: wa,
        passwordHash: hash,
        role: "student",
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      persist([user, ...users]);
      return null;
    },
    [users, persist]
  );

  const logout = useCallback(() => {
    setSessionId(null);
    saveSessionId(null);
  }, []);

  const setStatus = useCallback(
    (id: string, status: AuthUser["status"]) => {
      persist(users.map((u) => (u.id === id ? { ...u, status } : u)));
    },
    [users, persist]
  );

  const approve = useCallback((id: string) => setStatus(id, "approved"), [setStatus]);
  const reject = useCallback((id: string) => setStatus(id, "rejected"), [setStatus]);

  const removeUser = useCallback(
    (id: string) => {
      persist(users.filter((u) => u.id !== id));
      if (sessionId === id) {
        setSessionId(null);
        saveSessionId(null);
      }
    },
    [users, persist, sessionId]
  );

  const changePassword = useCallback(
    async (newPassword: string): Promise<AuthError> => {
      if (!session) return "no_user";
      if (newPassword.length < 6) return "password_short";
      const hash = await hashPassword(session.whatsapp, newPassword);
      persist(users.map((u) => (u.id === session.id ? { ...u, passwordHash: hash } : u)));
      return null;
    },
    [session, users, persist]
  );

  return (
    <Ctx.Provider
      value={{ ready, users, session, login, register, logout, approve, reject, removeUser, changePassword }}
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
