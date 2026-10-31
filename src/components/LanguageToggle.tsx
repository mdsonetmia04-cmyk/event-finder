"use client";

import { useLang } from "@/i18n/LanguageContext";

/** EN | বাং segmented language switcher for the header. */
export default function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      className="flex items-center rounded-lg border p-0.5 text-[12px] font-bold"
      style={{ borderColor: "var(--line)" }}
      role="group"
      aria-label="Language"
    >
      {(["en", "bn"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className="rounded-md px-2.5 py-1 transition-colors"
          style={
            lang === l
              ? { background: "var(--gold)", color: "#1a1405" }
              : { color: "var(--muted)" }
          }
        >
          {l === "en" ? "EN" : "বাং"}
        </button>
      ))}
    </div>
  );
}
