"use client";

/* Motion primitives for StockSeason Intelligence.
   Patterns adapted from Magic UI (MIT, magicuidesign/magicui):
   marquee loop + spring number ticker, rebuilt for this codebase. */

import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from "framer-motion";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ---------------- Scroll reveal ---------------- */

export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Click / hover pressable ---------------- */

export function Pressable({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.span
      className={className}
      style={{ display: "inline-block", ...style }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
    >
      {children}
    </motion.span>
  );
}

/* ---------------- Animated number ticker ---------------- */

export function NumberTicker({
  value,
  delay = 0,
  className,
}: {
  value: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 90 });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, isInView, delay, value]);

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current) {
          ref.current.textContent = Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0,
          }).format(Math.round(latest));
        }
      }),
    [springValue]
  );

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      0
    </span>
  );
}

/* ---------------- Marquee ticker ---------------- */

export function Marquee({
  children,
  duration = 42,
  className,
}: {
  children: ReactNode;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={`marquee ${className ?? ""}`}
      style={{ ["--marquee-duration" as string]: `${duration}s` }}
    >
      <div className="marquee-track">
        <div className="marquee-chunk">{children}</div>
        <div className="marquee-chunk" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Live Dhaka clock ---------------- */

export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      try {
        setNow(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Dhaka",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }).format(new Date())
        );
      } catch {
        setNow(new Date().toLocaleTimeString("en-GB"));
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={`tabular-nums ${className ?? ""}`}>{now}</span>;
}

/* ---------------- Animated height (FAQ etc.) ---------------- */

export function Expand({
  open,
  children,
  className,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className={className}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Animated check draw ---------------- */

export function CheckDraw({ checked, size = 14 }: { checked: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.path
        d="M4.5 12.5l5 5L19.5 7"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
        transition={{ duration: 0.28, ease: EASE }}
      />
    </svg>
  );
}
