/** Presence helpers: usage-time formatting + "live now" window. */

/** Seconds → "2h 15m" / "45m" / "30s" / "3d 2h" (or Bengali equivalents). */
export function formatUsage(totalSeconds: number | null | undefined, lang: string): string {
  const s = Math.max(0, Math.floor(totalSeconds ?? 0));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (lang === "bn") {
    if (d > 0) return `${d}দিন ${h}ঘণ্টা`;
    if (h > 0) return `${h}ঘণ্টা ${m}মিনিট`;
    if (m > 0) return `${m}মিনিট`;
    return `${s}সেকেন্ড`;
  }
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/** Considered "live now" when the last heartbeat is within 3 minutes. */
export function isLiveNow(lastSeen: string | null | undefined): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 3 * 60 * 1000;
}
