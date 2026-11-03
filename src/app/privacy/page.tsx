"use client";

/* Privacy Policy — public page, linked ONLY from the footer (never the nav).
   Bilingual EN | বাংলা via the site dictionaries. */

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

export default function PrivacyPage() {
  const { t } = useLang();
  const priv = t.privacy;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/" className="btn btn-ghost !text-xs">
        <ArrowLeft size={13} /> {priv.back}
      </Link>
      <div className="card mt-5 p-6 sm:p-9">
        <div className="mb-2 flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ background: "color-mix(in srgb, var(--gold) 14%, transparent)", color: "var(--gold-deep)" }}
          >
            <ShieldCheck size={22} />
          </span>
          <h1 className="font-serif-d text-2xl font-semibold sm:text-3xl">{priv.title}</h1>
        </div>
        <p className="mb-7 text-xs" style={{ color: "var(--muted)" }}>
          {priv.updated}
        </p>
        <div className="flex flex-col gap-6">
          {priv.sections.map((s) => (
            <section key={s.h}>
              <h2 className="font-serif-d mb-2 text-lg font-semibold" style={{ color: "var(--gold-deep)" }}>
                {s.h}
              </h2>
              {s.p.map((para, i) => (
                <p key={i} className="mb-2 text-[15px] leading-relaxed" style={{ color: "var(--text)" }}>
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
