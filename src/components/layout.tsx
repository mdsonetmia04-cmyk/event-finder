"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Heart,
  Home,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Globe2,
  ClipboardList,
  Leaf,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { KEYS } from "@/lib/store";
import { CONTACT, META } from "@/lib/data";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "./AuthContext";
import type { Dict } from "@/i18n/dictionaries";
import LanguageToggle from "./LanguageToggle";

/* ---------------- Theme ---------------- */

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEYS.theme) as Theme | null;
    const initial = saved === "light" || saved === "dark" ? saved : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem(KEYS.theme, next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  }, []);

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div style={{ visibility: ready ? "visible" : "hidden" }}>{children}</div>
    </ThemeCtx.Provider>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  const dark = theme === "dark";
  return (
    <button
      onClick={toggle}
      className="icon-circle"
      aria-label={dark ? t.theme.toLight : t.theme.toDark}
      title={dark ? t.theme.lightTitle : t.theme.darkTitle}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

/* ---------------- Header ---------------- */

function navItems(t: Dict) {
  return [
    { href: "/", label: t.nav.dashboard, icon: Home },
    { href: "/calendar", label: t.nav.calendar, icon: CalendarDays },
    { href: "/opportunities", label: t.nav.opportunities, icon: Sparkles },
    { href: "/markets", label: t.nav.markets, icon: Globe2 },
    { href: "/planner", label: t.nav.planner, icon: ClipboardList },
    { href: "/evergreen", label: t.nav.evergreen, icon: Leaf },
    { href: "/announcements", label: "🔔", icon: Megaphone },
    { href: "/contact", label: t.nav.contact, icon: Mail },
  ];
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  const { session, logout, users, refreshUsers } = useAuth();
  const NAV = session?.role === "super_admin"
    ? [...navItems(t), { href: "/admin", label: t.nav.admin, icon: ShieldCheck }]
    : navItems(t);
  const pendingCount = session?.role === "super_admin"
    ? users.filter((u) => u.status === "pending").length
    : 0;

  // Keep the pending-approvals badge fresh while the admin browses the site.
  useEffect(() => {
    if (session?.role !== "super_admin") return;
    const timer = setInterval(refreshUsers, 60_000);
    return () => clearInterval(timer);
  }, [session?.role, refreshUsers]);

  return (
    <header className="sticky top-3 z-40 no-print px-3 sm:px-4">
      <div className="nav-pill mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gold)" }}>
            <CalendarDays size={19} className="gold-contrast-icon" strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="font-serif-d block text-[16px] font-semibold tracking-tight">
              Sweet Smart Calendar
            </span>
            <span className="label !text-[10px] hidden sm:block">Plan Smarter · Upload Earlier</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`nav-link${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {session?.role === "super_admin" && (
            <Link
              href="/admin"
              className="icon-circle relative"
              title={t.admin.pendingT}
              aria-label={`${t.admin.pendingT}: ${pendingCount}`}
            >
              <Bell size={16} />
              {pendingCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white tabular-nums"
                  style={{ background: "#b3261e" }}
                >
                  {pendingCount > 99 ? "99+" : pendingCount}
                </span>
              )}
            </Link>
          )}
          {session && (
            <Link
              href="/profile"
              className="chip hidden !py-1.5 transition-transform hover:scale-[1.04] md:inline-flex"
              title={session.whatsapp}
            >
              {session.role === "super_admin" ? <ShieldCheck size={12} /> : <UserRound size={12} />}
              <span className="max-w-[110px] truncate font-semibold">{session.name}</span>
            </Link>
          )}
          <LanguageToggle />
          <ThemeToggle />
          {session && (
            <button
              className="icon-circle"
              onClick={logout}
              title={t.auth.logout}
              aria-label={t.auth.logout}
            >
              <LogOut size={16} />
            </button>
          )}
          <button
            className="icon-circle xl:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="card mx-auto mt-2 max-w-7xl px-3 py-3 xl:hidden" aria-label="Mobile">
          <div className="grid gap-1">
            {session && (
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className={`nav-link flex items-center gap-3 !text-sm !font-medium${pathname === "/profile" ? " active" : ""}`}
              >
                <UserRound size={16} /> {session.name}
              </Link>
            )}
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`nav-link flex items-center gap-3 !text-sm !font-medium${active ? " active" : ""}`}
                >
                  <Icon size={16} /> {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

/* ---------------- Footer ---------------- */

export function Footer() {
  const { t } = useLang();
  const NAV = navItems(t);
  return (
    <footer className="mt-16 border-t no-print" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif-d text-lg font-semibold">Sweet Smart Calendar</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t.footer.tagline}
          </p>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            {META.disclaimer}
          </p>
        </div>
        <div>
          <p className="label mb-3">{t.footer.explore}</p>
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:opacity-70" style={{ color: "var(--muted)" }}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3">{t.footer.contactH}</p>
          <p className="text-sm font-medium">{CONTACT.name}</p>
          <a
            href={CONTACT.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm font-medium hover:opacity-80"
            style={{ color: "var(--steel-deep)" }}
          >
            <Heart size={14} /> WhatsApp: {CONTACT.whatsappDisplay}
          </a>
          <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
            {t.footer.lastUpdate}: {META.lastResearchUpdate}
          </p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        {t.footer.rights(new Date().getFullYear())}
      </div>
    </footer>
  );
}
