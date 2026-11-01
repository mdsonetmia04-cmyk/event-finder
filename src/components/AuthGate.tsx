"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, LogOut, ShieldX } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "@/i18n/LanguageContext";

/** Gates the whole site: only approved users (and the super admin) get in. */
export default function AuthGate({
  children,
  shell,
}: {
  children: ReactNode;
  shell: (page: ReactNode) => ReactNode;
}) {
  const { ready, session } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!ready) return;
    if (!session && !isLogin) router.replace("/login");
    if (session && isLogin) router.replace("/");
  }, [ready, session, isLogin, router]);

  if (!ready) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <span className="loader" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (!session) {
    return isLogin ? <>{children}</> : null;
  }

  if (session.status === "pending") return <PendingScreen />;
  if (session.status === "rejected") return <RejectedScreen />;

  return <>{shell(children)}</>;
}

function PendingScreen() {
  const { t } = useLang();
  const { logout, session } = useAuth();
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="auth-icon"><Clock3 size={26} /></span>
        <h1 className="font-serif-d text-2xl font-semibold">{t.auth.pendingT}</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.auth.pendingH(session?.name ?? "")}
        </p>
        <button className="btn btn-ghost mt-5" onClick={logout}>
          <LogOut size={14} /> {t.auth.logout}
        </button>
      </div>
    </div>
  );
}

function RejectedScreen() {
  const { t } = useLang();
  const { logout } = useAuth();
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="auth-icon"><ShieldX size={26} /></span>
        <h1 className="font-serif-d text-2xl font-semibold">{t.auth.rejectedT}</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.auth.rejectedH}
        </p>
        <button className="btn btn-ghost mt-5" onClick={logout}>
          <LogOut size={14} /> {t.auth.logout}
        </button>
      </div>
    </div>
  );
}
