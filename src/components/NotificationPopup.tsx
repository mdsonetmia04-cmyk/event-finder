"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";

export interface SiteNotification {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

const DISMISSED_KEY = "ssi-notif-dismissed";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Site-wide popup: shows the newest active admin notification the visitor
    hasn't dismissed yet. Only logged-in (registered) users see it — guests
    on the landing page do not. */
export function NotificationPopup() {
  const { t } = useLang();
  const { session } = useAuth();
  const [current, setCurrent] = useState<SiteNotification | null>(null);

  const pickNewest = useCallback((list: SiteNotification[]) => {
    const dismissed = getDismissed();
    const fresh = list.filter((n) => !dismissed.includes(n.id));
    setCurrent(fresh.length > 0 ? fresh[0] : null);
  }, []);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("admin_notifications")
      .select("id, title, body, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) pickNewest(data as SiteNotification[]);
  }, [pickNewest]);

  useEffect(() => {
    if (!session) {
      setCurrent(null);
      return;
    }
    load();
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("site-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_notifications" },
        (payload) => {
          const n = payload.new as SiteNotification & { active: boolean };
          if (n.active) {
            const dismissed = getDismissed();
            if (!dismissed.includes(n.id)) {
              setCurrent({ id: n.id, title: n.title, body: n.body, created_at: n.created_at });
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, session?.id]);

  const dismiss = () => {
    if (!current) return;
    try {
      const dismissed = getDismissed();
      dismissed.push(current.id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    } catch {
      /* ignore */
    }
    setCurrent(null);
  };

  if (!session || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label={t.notif.title}
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))" }}
          >
            <BellRing size={20} />
          </span>
          <button
            className="btn btn-ghost !px-2.5 !py-2"
            onClick={dismiss}
            aria-label={t.auth.close}
          >
            <X size={16} />
          </button>
        </div>
        <h2 className="font-serif-d mt-3 text-xl font-semibold">{current.title}</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          {current.body}
        </p>
        <button className="btn btn-gold mt-5 w-full" onClick={dismiss}>
          {t.notif.ok}
        </button>
      </div>
    </div>
  );
}
