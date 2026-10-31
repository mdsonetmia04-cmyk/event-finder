"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Heart,
  Home,
  Mail,
  Menu,
  Moon,
  Sparkles,
  Sun,
  Globe2,
  ClipboardList,
  X,
  FlaskConical,
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

/* ---------------- Theme ---------------- */

type Theme = "dark" | "light";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEYS.theme) as Theme | null;
    const initial = saved === "light" || saved === "dark" ? saved : "dark";
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
  return (
    <button
      onClick={toggle}
      className="btn btn-ghost !px-3 !py-2"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

/* ---------------- Header ---------------- */

const NAV = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/calendar", label: "Smart Calendar", icon: CalendarDays },
  { href: "/opportunities", label: "Opportunities", icon: Sparkles },
  { href: "/markets", label: "Global Markets", icon: Globe2 },
  { href: "/planner", label: "Asset Planner", icon: ClipboardList },
  { href: "/sources", label: "Research Sources", icon: FlaskConical },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b no-print" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 88%, transparent)", backdropFilter: "blur(12px)" }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gold)" }}>
            <CalendarDays size={19} color="#1a1405" strokeWidth={2.4} />
          </span>
          <span className="leading-tight">
            <span className="font-serif-d block text-[17px] font-semibold tracking-tight">
              StockSeason Intelligence
            </span>
            <span className="label !text-[10px] hidden sm:block">Plan Smarter · Upload Earlier</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                  active ? "btn-active !rounded-lg" : "hover:opacity-70"
                }`}
                style={active ? {} : { color: "var(--muted)" }}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            className="btn btn-ghost !px-3 !py-2 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t px-4 py-3 lg:hidden" style={{ borderColor: "var(--line)" }} aria-label="Mobile">
          <div className="grid gap-1">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "btn-active" : ""}`}
                  style={active ? {} : { color: "var(--muted)" }}
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
  return (
    <footer className="mt-16 border-t no-print" style={{ borderColor: "var(--line)" }}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif-d text-lg font-semibold">StockSeason Intelligence</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Plan Smarter. Upload Earlier. Create for Global Demand.
          </p>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            {META.disclaimer}
          </p>
        </div>
        <div>
          <p className="label mb-3">Explore</p>
          <div className="grid grid-cols-2 gap-1.5 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:opacity-70" style={{ color: "var(--muted)" }}>
                {n.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="label mb-3">Contact</p>
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
            Last research update: {META.lastResearchUpdate}
          </p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        © {new Date().getFullYear()} StockSeason Intelligence · Research-based planning guidance for Adobe Stock contributors
      </div>
    </footer>
  );
}
