"use client";

import Image from "next/image";
import Link from "next/link";
import { Globe, MessageCircle, MessagesSquare } from "lucide-react";
import { CONTACT, META } from "@/lib/data";
import { SectionHeader } from "@/components/ui";
import { StudentChatBox } from "@/components/AdminChat";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLang();
  const { session } = useAuth();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <SectionHeader
        title={t.contact.title}
        subtitle={t.contact.sub}
      />
      <div className="card p-6 text-center sm:p-8">
        {/* Bigger picture, background removed, soft gold glow */}
        <div className="relative mx-auto h-44 w-44 sm:h-52 sm:w-52">
          <span
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(201,151,31,.35), transparent 70%)" }}
            aria-hidden="true"
          />
          <Image
            src="/images/sonet-profile.png"
            alt={CONTACT.name}
            fill
            sizes="208px"
            className="relative rounded-full object-cover"
            style={{ filter: "drop-shadow(0 12px 24px rgba(166,106,25,.25))" }}
            priority
          />
        </div>
        <h2 className="font-serif-d mt-4 text-3xl font-semibold">{CONTACT.name}</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {t.contact.creatorOf}
          <br />
          {t.contact.creatorOf2}
        </p>

        {/* WhatsApp: number hidden, just the chat button */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <a
            href={CONTACT.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold !px-8 !py-3 !text-base"
          >
            <MessageCircle size={18} /> {t.contact.chatOn}
          </a>

          {/* Personal Website: text link */}
          <a
            href="https://mdsonetmia.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-base font-semibold underline decoration-1 underline-offset-4 hover:opacity-80"
            style={{ color: "var(--gold-deep)" }}
          >
            <Globe size={18} /> {t.contact.personalWebsite}
          </a>
        </div>

        <div className="mt-6 text-left text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          <p className="mb-2 font-semibold" style={{ color: "var(--text)" }}>
            {t.contact.whatToSend}
          </p>
          <ul className="grid gap-1">
            {t.contact.items.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chat with Admin: chatbox embedded directly on the page */}
      <section>
        <h2 className="font-serif-d mb-3 flex items-center gap-2 text-lg font-semibold">
          <MessagesSquare size={18} style={{ color: "var(--gold-deep)" }} />
          {t.contact.chatAdminT}
        </h2>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>
          {t.contact.chatAdminD}
        </p>
        {session ? (
          <StudentChatBox />
        ) : (
          <div className="card p-6 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {t.chat.loginRequired}
            </p>
            <Link href="/login" className="btn btn-gold mt-4">
              {t.auth.loginTab}
            </Link>
          </div>
        )}
      </section>

      <p className="rounded-xl border px-4 py-3 text-xs leading-relaxed" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        {META.disclaimer}
      </p>
    </div>
  );
}
