"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

/** Floating heart button that opens the Gaming Zone. Hidden inside /games. */
export default function GamesButton() {
  const pathname = usePathname();
  const { t } = useLang();

  if (pathname.startsWith("/games")) return null;

  return (
    <Link
      href="/games"
      aria-label={t.games.button}
      className="fixed right-4 z-40 flex items-center gap-2 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        background: "linear-gradient(135deg, var(--gold-2), #E5484D)",
        padding: "0.7rem",
      }}
    >
      <span
        aria-hidden="true"
        className="games-heart-ring pointer-events-none absolute inset-0 rounded-full"
        style={{ border: "2px solid #E5484D" }}
      />
      <Heart size={22} fill="currentColor" aria-hidden="true" />
      <span className="hidden pr-1 text-sm font-semibold sm:inline">{t.games.button}</span>
    </Link>
  );
}
