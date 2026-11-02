"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, Facebook, Globe, LogOut, ShieldX, X } from "lucide-react";
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
  // "/" is public: logged-out visitors see the landing page, logged-in users get the dashboard.
  const isPublic = isLogin || pathname === "/";

  useEffect(() => {
    if (!ready) return;
    if (!session && !isPublic) router.replace("/login");
    if (session && isLogin) router.replace("/");
  }, [ready, session, isLogin, isPublic, router]);

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
    return isPublic ? <>{children}</> : null;
  }

  if (session.status === "pending") return <PendingScreen />;
  if (session.status === "rejected") return <RejectedScreen />;

  return <>{shell(children)}</>;
}

function PendingScreen() {
  const { t } = useLang();
  const { logout, session } = useAuth();
  const [showContact, setShowContact] = useState(false);
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <span className="auth-icon"><Clock3 size={26} /></span>
        <h1 className="font-serif-d text-2xl font-semibold">{t.auth.pendingT}</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.auth.pendingH(session?.name ?? "")}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button className="btn btn-gold" onClick={() => setShowContact(true)}>
            {t.auth.contactAdmin}
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            <LogOut size={14} /> {t.auth.logout}
          </button>
        </div>
      </div>
      {showContact && <ContactAdminModal onClose={() => setShowContact(false)} />}
    </div>
  );
}

/** Popup with the super admin's contact channels: website, WhatsApp, Facebook. */
function ContactAdminModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang();
  const channels = [
    {
      label: t.auth.chWebsite,
      href: "https://md.sonet.mia.vercel.app",
      icon: <Globe size={26} />,
    },
    {
      label: t.auth.chWhatsapp,
      href: "https://wa.me/8801797953059",
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.3.18-1.42-.08-.12-.28-.2-.58-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 1 1 8.38 4.63M12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.16-3.48-8.41A11.82 11.82 0 0 0 12.05 0" />
        </svg>
      ),
    },
    {
      label: t.auth.chFacebook,
      href: "https://www.facebook.com/mdsont.mia.777",
      icon: <Facebook size={26} />,
    },
  ];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.auth.contactAdmin}
    >
      <div
        className="card w-full max-w-sm p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-serif-d text-xl font-semibold">{t.auth.contactAdmin}</h2>
          <button
            className="btn btn-ghost"
            style={{ padding: "8px" }}
            onClick={onClose}
            aria-label={t.auth.close}
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t.auth.contactAdminSub}
        </p>
        <div className="mt-5 flex items-center justify-center gap-5">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                style={{
                  color: "#fff",
                  background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))",
                  boxShadow: "0 6px 18px rgba(166,106,25,0.35)",
                }}
              >
                {c.icon}
              </span>
              <span className="text-xs font-medium">{c.label}</span>
            </a>
          ))}
        </div>
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
