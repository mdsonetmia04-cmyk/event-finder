"use client";

import Link from "next/link";
import { ArrowLeft, Bot, ScrollText, Users } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { SectionHeader } from "@/components/ui";

export default function LudoModePage() {
  const { t } = useLang();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <SectionHeader title={t.games.modeTitle} subtitle={t.games.modeSub} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/games/ludo/solo" className="card card-hover block p-5 sm:p-6">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-deep))" }}
          >
            <Bot size={24} aria-hidden="true" />
          </span>
          <h2 className="font-serif-d mt-3 text-xl font-semibold">{t.games.soloTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.soloDesc}
          </p>
          <span className="btn btn-gold mt-4">{t.games.playVsComputer}</span>
        </Link>

        <Link href="/games/ludo/friends" className="card card-hover block p-5 sm:p-6">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-white"
            style={{ background: "linear-gradient(135deg, #3E7BFA, #2FA36B)" }}
          >
            <Users size={24} aria-hidden="true" />
          </span>
          <h2 className="font-serif-d mt-3 text-xl font-semibold">{t.games.friendsTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {t.games.friendsDesc}
          </p>
          <span className="btn btn-gold mt-4">{t.games.playWithFriends}</span>
        </Link>
      </div>

      <p className="card flex items-start gap-2.5 p-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        <ScrollText size={18} className="mt-0.5 shrink-0" style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
        {t.games.rulesNote}
      </p>

      <div>
        <Link href="/games" className="btn btn-ghost">
          <ArrowLeft size={16} aria-hidden="true" />
          {t.games.backToZone}
        </Link>
      </div>
    </div>
  );
}
