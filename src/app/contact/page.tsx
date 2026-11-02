"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Globe, MessageCircle, MessagesSquare } from "lucide-react";
import { CONTACT, META } from "@/lib/data";
import { SectionHeader } from "@/components/ui";
import { AdminChatModal } from "@/components/AdminChat";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLang();
  const { session } = useAuth();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);

  const openChat = () => {
    if (!session) {
      router.push("/login");
      return;
    }
    setChatOpen(true);
  };

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
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t.contact.creatorOf}
        </p>

        {/* WhatsApp: number hidden, just the chat button */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <a
            href={CONTACT.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold !px-8 !py-3 !text-base"
          >
            <MessageCircle size={18} /> {t.contact.chatOn}
          </a>

          {/* Website: icon only */}
          <a
            href="https://mdsonetmia.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.contact.website}
            title={t.contact.website}
            className="group flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-110"
            style={{
              color: "#fff",
              background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))",
              boxShadow: "0 6px 18px rgba(166,106,25,0.35)",
            }}
          >
            <Globe size={24} />
          </a>
        </div>

        {/* Chat with Admin: opens an in-website chatbox */}
        <div className="mt-6 rounded-2xl p-5" style={{ background: "var(--surface2)" }}>
          <p className="flex items-center justify-center gap-2 font-semibold">
            <MessagesSquare size={18} style={{ color: "var(--gold-deep)" }} />
            {t.contact.chatAdminT}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: "var(--muted)" }}>
            {t.contact.chatAdminD}
          </p>
          <button className="btn btn-gold mt-4" onClick={openChat}>
            <MessagesSquare size={16} /> {t.contact.chatAdminBtn}
          </button>
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

      <p className="rounded-xl border px-4 py-3 text-xs leading-relaxed" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        {META.disclaimer}
      </p>

      {chatOpen && <AdminChatModal onClose={() => setChatOpen(false)} />}
    </div>
  );
}
