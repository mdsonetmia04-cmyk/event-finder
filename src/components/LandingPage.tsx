"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Globe2,
  Languages,
  LayoutDashboard,
  Leaf,
  MessagesSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import { LiveClock } from "@/components/motion";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";

const FEATURE_ICONS = [CalendarDays, TrendingUp, Globe2, ClipboardCheck, Leaf, Languages];
const STEP_ICONS = [UserPlus, ShieldCheck, Sparkles];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      setDark(document.documentElement.classList.contains("dark"));
    } catch {
      /* noop */
    }
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem("ssi-theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
    } catch {
      /* noop */
    }
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
      style={{ borderColor: "var(--line)", color: "var(--muted)" }}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

/** Single-button language switcher for the mobile top bar (space is tight there). */
function CompactLang() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
      aria-label="Switch language"
      className="flex h-9 min-w-9 items-center justify-center rounded-full border px-2.5 text-xs font-bold transition-colors"
      style={{ borderColor: "var(--line)", color: "var(--gold)" }}
    >
      {lang === "bn" ? "EN" : "বাং"}
    </button>
  );
}

/** Animated number for the stats band — counts up when scrolled into view. */
function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString("en-US")}</span>;
}

/** "What's inside" directory — numbered list of the app's sections so guests
    know exactly where to go after approval. Names come from the nav dict,
    so the list is bilingual for free. */
const INSIDE_FUNCTIONS = [
  { icon: LayoutDashboard, key: "dashboard" },
  { icon: CalendarDays, key: "calendar" },
  { icon: TrendingUp, key: "opportunities" },
  { icon: Globe2, key: "markets" },
  { icon: ClipboardCheck, key: "planner" },
  { icon: Leaf, key: "evergreen" },
  { icon: BookOpen, key: "sources" },
  { icon: Bell, key: "announcements" },
  { icon: MessagesSquare, key: "contact" },
] as const;

function InsideList() {
  const { t } = useLang();
  return (
    <motion.div {...fadeUp} className="mx-auto mt-10 max-w-3xl">
      <div
        className="rounded-[2rem] border p-3 sm:p-5"
        style={{ borderColor: "var(--line)", background: "var(--bg2)" }}
      >
        <ol className="grid gap-2 sm:grid-cols-2">
          {INSIDE_FUNCTIONS.map((f, i) => {
            const Icon = f.icon;
            return (
              <li
                key={f.key}
                className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-transform hover:-translate-y-0.5"
                style={{ borderColor: "var(--line)", background: "var(--bg)" }}
              >
                <span className="font-serif-d text-sm font-bold tabular-nums" style={{ color: "var(--gold)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "color-mix(in srgb, var(--gold) 14%, transparent)", color: "var(--gold)" }}
                >
                  <Icon size={18} />
                </span>
                <span className="text-[15px] font-semibold">{t.nav[f.key]}</span>
                <ArrowRight size={15} className="ml-auto shrink-0" style={{ color: "var(--muted)" }} />
              </li>
            );
          })}
        </ol>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const { t } = useLang();
  const L = t.landing;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [joined, setJoined] = useState<number | null>(null);
  const year = new Date().getFullYear();

  // Live "learners already joined" counter — refreshes every minute.
  useEffect(() => {
    let stop = false;
    const fetchCount = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;
        const { data } = await supabase.rpc("registered_count");
        if (!stop && typeof data === "number") setJoined(data);
      } catch {
        /* offline / RPC missing — pill simply stays hidden */
      }
    };
    fetchCount();
    const id = setInterval(fetchCount, 60000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      {/* ── Top bar ─────────────────────────────── */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{ background: "color-mix(in srgb, var(--bg) 82%, transparent)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "var(--gold)", color: "#fff" }}
            >
              <CalendarDays size={18} />
            </span>
            <span className="font-serif-d hidden text-lg font-semibold tracking-tight min-[420px]:block">Sweet Smart Calendar</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <span className="hidden sm:block">
              <LanguageToggle />
            </span>
            <span className="sm:hidden">
              <CompactLang />
            </span>
            <span className="hidden sm:block">
              <ThemeToggle />
            </span>
            <Link href="/login" className="btn btn-ghost hidden !rounded-full px-4 py-2 text-sm sm:inline-flex">
              {L.ctaLogin}
            </Link>
            <Link href="/login" className="btn btn-gold !rounded-full px-4 py-2 text-sm font-semibold">
              {L.ctaRegister}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--gold-soft)" }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-14 md:grid-cols-2 md:pt-20">
          <motion.div {...fadeUp}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ borderColor: "var(--gold)", color: "var(--gold)" }}
            >
              <Sparkles size={13} /> {L.badge}
            </span>
            <h1 className="font-serif-d mt-5 text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {L.titleA}
              <br />
              {L.titleB}
              <br />
              <span style={{ color: "var(--gold)" }}>{L.titleC}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--muted)" }}>
              {L.sub}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href="/login" className="btn btn-gold w-full !rounded-full px-7 py-3.5 text-base font-bold sm:w-auto">
                {L.ctaRegister} <ArrowRight size={17} />
              </Link>
              <Link href="/login" className="btn btn-ghost w-full !rounded-full px-7 py-3.5 text-base font-semibold sm:w-auto">
                {L.ctaLogin}
              </Link>
            </div>
            {joined !== null && joined > 0 && (
              <div
                className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold"
                style={{
                  borderColor: "var(--gold)",
                  color: "var(--gold-deep)",
                  background: "color-mix(in srgb, var(--gold) 8%, transparent)",
                }}
              >
                <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: "var(--gold)" }} />
                {L.joined(joined)}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
              <span className="inline-flex items-center gap-1.5 normal-case tracking-normal">
                <span className="live-dot" aria-hidden="true" /> Dhaka <LiveClock />
              </span>
              <span>{L.trust}</span>
            </div>
          </motion.div>
          <motion.div
            {...fadeUp}
            className="relative mx-auto hidden w-full max-w-[420px] md:block"
            aria-hidden
          >
            <div
              className="absolute inset-6 rounded-[2.5rem] opacity-40 blur-2xl"
              style={{ background: "var(--gold-soft)" }}
            />
            <div
              className="relative overflow-hidden rounded-[2.5rem] border"
              style={{ borderColor: "var(--line)", background: "var(--bg2)" }}
            >
              <Image
                src="/images/hero-chess-cutout.png"
                alt=""
                width={594}
                height={652}
                className="h-auto w-full"
                priority
              />
            </div>
            <div
              className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-bold shadow-lg"
              style={{ background: "var(--bg)", borderColor: "var(--line)" }}
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: "var(--gold)" }} />
              {L.stats[0].n} {L.stats[0].l}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--bg2)" }}>
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x px-5 sm:grid-cols-4" style={{ ["--tw-divide-opacity" as string]: 1, borderColor: "var(--line)" }}>
          {L.stats.map((s) => (
            <div key={s.l} className="px-4 py-7 text-center">
              <div className="font-serif-d text-3xl font-semibold tabular-nums sm:text-4xl" style={{ color: "var(--gold)" }}>
                {/^\d+$/.test(s.n) ? <CountUp to={parseInt(s.n, 10)} /> : s.n}
              </div>
              <div className="mt-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── App preview ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>
            {L.previewK}
          </p>
          <h2 className="font-serif-d mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{L.previewH}</h2>
          <p className="mt-3" style={{ color: "var(--muted)" }}>{L.previewSub}</p>
        </motion.div>
        <InsideList />
      </section>

      {/* ── Features ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif-d text-3xl font-semibold tracking-tight sm:text-4xl">{L.featH}</h2>
          <p className="mt-3" style={{ color: "var(--muted)" }}>{L.featSub}</p>
        </motion.div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {L.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <motion.div
                key={f.t}
                {...fadeUp}
                className="rounded-3xl border p-6 transition-transform hover:-translate-y-1"
                style={{ borderColor: "var(--line)", background: "var(--bg2)" }}
              >
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: "color-mix(in srgb, var(--gold) 14%, transparent)", color: "var(--gold)" }}
                >
                  <Icon size={20} />
                </span>
                <h3 className="font-serif-d mt-4 text-xl font-semibold">{f.t}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{f.d}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── How it works ────────────────────────── */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <motion.h2 {...fadeUp} className="font-serif-d text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {L.howH}
          </motion.h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {L.steps.map((s, i) => {
              const Icon = STEP_ICONS[i % STEP_ICONS.length];
              return (
                <motion.div
                  key={s.t}
                  {...fadeUp}
                  className="relative rounded-3xl border p-7"
                  style={{ borderColor: "var(--line)", background: "var(--bg)" }}
                >
                  <span
                    className="font-serif-d absolute right-6 top-5 text-5xl font-semibold opacity-15"
                    style={{ color: "var(--gold)" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: "var(--gold)", color: "#fff" }}
                  >
                    <Icon size={20} />
                  </span>
                  <h3 className="font-serif-d mt-4 text-xl font-semibold">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{s.d}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Mentor ──────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 md:py-20">
        <motion.div
          {...fadeUp}
          className="flex flex-col items-center gap-8 rounded-[2.5rem] border p-8 text-center sm:p-12 md:flex-row md:text-left"
          style={{ borderColor: "var(--line)", background: "var(--bg2)" }}
        >
          <Image
            src="/images/sonet-profile.png"
            alt="Md Sonet Mia"
            width={160}
            height={160}
            className="h-36 w-36 shrink-0 rounded-full border-4 object-cover"
            style={{ borderColor: "var(--gold)" }}
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "var(--gold)" }}>
              {L.mentorK}
            </p>
            <h3 className="font-serif-d mt-2 text-2xl font-semibold sm:text-3xl">Md Sonet Mia</h3>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed md:mx-0" style={{ color: "var(--muted)" }}>
              {L.mentorT}
            </p>
            <a
              href="https://mdsonetmia.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost !rounded-full mt-5 px-5 py-2.5 text-sm font-semibold"
            >
              {L.mentorCta} <ArrowRight size={15} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ─────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-16 md:pb-20">
        <motion.h2 {...fadeUp} className="font-serif-d text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {L.faqH}
        </motion.h2>
        <div className="mt-8 space-y-3">
          {L.faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <motion.div
                key={f.q}
                {...fadeUp}
                className="overflow-hidden rounded-2xl border"
                style={{ borderColor: "var(--line)", background: "var(--bg2)" }}
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-semibold"
                >
                  {f.q}
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform"
                    style={{ transform: open ? "rotate(180deg)" : undefined, color: "var(--gold)" }}
                  />
                </button>
                {open && (
                  <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                    {f.a}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 md:pb-20">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-[2.5rem] px-8 py-14 text-center sm:py-16"
          style={{ background: "var(--gold)" }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
            style={{ background: "#fff" }}
          />
          <h2 className="font-serif-d relative text-3xl font-semibold text-white sm:text-4xl">{L.finalT}</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/85">{L.finalSub}</p>
          <Link
            href="/login"
            className="btn relative mt-8 !rounded-full bg-white px-8 py-3.5 text-base font-bold"
            style={{ color: "var(--gold-deep)" }}
          >
            {L.finalCta} <ArrowRight size={17} />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--line)" }}>
        <div className="flex items-center justify-center gap-3 px-5 pt-6 sm:hidden">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--gold)", color: "#fff" }}
            >
              <CalendarDays size={15} />
            </span>
            <span className="font-serif-d font-semibold">Sweet Smart Calendar</span>
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            © {year} Sweet Smart Calendar · {L.footerNote}
          </p>
        </div>
      </footer>
    </div>
  );
}
