"use client";

import { useEffect, useState } from "react";
import { BellDot, BellRing } from "lucide-react";
import { SectionHeader, EmptyState } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import type { SiteNotification } from "@/components/NotificationPopup";

export default function AnnouncementsPage() {
  const { t, lang } = useLang();
  const [items, setItems] = useState<SiteNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("admin_notifications")
      .select("id, title, body, created_at, user_id")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setItems(data as SiteNotification[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <SectionHeader title={t.announce.title} subtitle={t.announce.sub} />
      {loading ? (
        <div className="card flex justify-center p-10">
          <span className="loader" aria-label="Loading" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={t.announce.emptyT} hint={t.announce.emptyH} />
      ) : (
        <div className="grid gap-3">
          {items.map((n) => (
            <article key={n.id} className="card p-5">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))" }}
                >
                  <BellRing size={18} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-serif-d text-lg font-semibold leading-snug">{n.title}</h2>
                  {n.user_id && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>
                      <BellDot size={13} /> {t.alert.private}
                    </p>
                  )}
                  <p className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                    {new Date(n.created_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {n.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
