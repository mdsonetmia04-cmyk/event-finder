"use client";

import { MessageCircle } from "lucide-react";
import { CONTACT, META } from "@/lib/data";
import { SectionHeader } from "@/components/ui";

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <SectionHeader
        title="Contact"
        subtitle="Questions, corrections or partnership inquiries about StockSeason Intelligence."
      />
      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <span
            className="font-serif-d flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold"
            style={{ background: "var(--gold)", color: "#1a1405" }}
          >
            SM
          </span>
          <div>
            <h2 className="font-serif-d text-2xl font-semibold">{CONTACT.name}</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Creator of StockSeason Intelligence
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl p-4" style={{ background: "var(--surface2)" }}>
          <p className="label mb-1">WhatsApp</p>
          <p className="text-lg font-semibold tabular-nums">{CONTACT.whatsappDisplay}</p>
          <a
            href={CONTACT.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold mt-3"
          >
            <MessageCircle size={16} /> Chat on WhatsApp
          </a>
        </div>

        <div className="mt-6 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          <p className="mb-2 font-semibold" style={{ color: "var(--text)" }}>
            What to send
          </p>
          <ul className="grid gap-1">
            <li>· Date corrections for any tracked event</li>
            <li>· New seasonal events or markets to add</li>
            <li>· Feedback on recommendation accuracy</li>
            <li>· Partnership or licensing inquiries</li>
          </ul>
        </div>
      </div>

      <p className="rounded-xl border px-4 py-3 text-xs leading-relaxed" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        {META.disclaimer}
      </p>
    </div>
  );
}
