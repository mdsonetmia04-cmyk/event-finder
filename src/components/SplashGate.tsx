"use client";

import { useEffect, useState } from "react";
import BrandLoader from "./BrandLoader";

/** First-load splash: covers the very first paint, then fades away
 *  once the app has hydrated. A CSS fallback animation
 *  (splash-auto-hide) hides it even if the timers never run,
 *  so it can never stick on screen. */
export default function SplashGate() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const fade = setTimeout(() => setPhase("fade"), 900);
    const gone = setTimeout(() => setPhase("gone"), 1400);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className="splash-gate fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "var(--bg)",
        opacity: phase === "fade" ? 0 : 1,
        transition: "opacity 0.45s ease",
        pointerEvents: phase === "fade" ? "none" : "auto",
      }}
    >
      <BrandLoader />
    </div>
  );
}
