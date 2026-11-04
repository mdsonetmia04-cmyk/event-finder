"use client";

import { useEffect } from "react";

/** Registers the PWA service worker (no-op where unsupported). */
export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline caching is a bonus, not a requirement */
      });
    }
  }, []);
  return null;
}
