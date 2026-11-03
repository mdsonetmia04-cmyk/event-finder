"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, BellDot, BellRing, CheckCheck, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";

export interface SiteNotification {
  id: string;
  title: string;
  body: string;
  title_en?: string | null;
  body_en?: string | null;
  title_bn?: string | null;
  body_bn?: string | null;
  created_at: string;
  user_id?: string | null;
}

const DISMISSED_KEY = "ssi-notif-dismissed";

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function rememberDismissed(id: string) {
  try {
    const dismissed = getDismissed();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
    }
  } catch {
    /* ignore */
  }
}

/** Pick the visitor's language, falling back to whichever version exists. */
function localize(n: SiteNotification, lang: string): { title: string; body: string } {
  if (lang === "bn") {
    return {
      title: n.title_bn || n.title || "",
      body: n.body_bn || n.body || "",
    };
  }
  return {
    title: n.title_en || n.title || "",
    body: n.body_en || n.body || "",
  };
}

/** Site-wide announcement popup. Shows every unread active admin
    notification as a queue ("1 of N"). A notification is marked READ on the
    server the moment it is shown, so a dismissed announcement never
    reappears — localStorage is only a fallback. Private alerts (user_id set)
    are visible only to their recipient. Logged-in users only; guests never
    see it. */
export function NotificationPopup() {
  const { t, lang } = useLang();
  const { session } = useAuth();
  const [queue, setQueue] = useState<SiteNotification[]>([]);

  const current = queue[0] ?? null;

  const markRead = useCallback(async (id: string) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.rpc("mark_notification_read", { p_notification_id: id });
    } catch {
      /* offline — localStorage fallback below still applies */
    }
    rememberDismissed(id);
  }, []);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const [{ data: notifs }, { data: reads }] = await Promise.all([
      supabase
        .from("admin_notifications")
        .select("id, title, body, title_en, body_en, title_bn, body_bn, created_at, user_id")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("notification_reads").select("notification_id"),
    ]);
    if (!notifs) return;
    const readIds = new Set([
      ...((reads ?? []).map((r: { notification_id: string }) => r.notification_id)),
      ...getDismissed(),
    ]);
    const fresh = (notifs as SiteNotification[]).filter((n) => !readIds.has(n.id));
    setQueue(fresh);
    // Mark the first one read the moment it is shown.
    if (fresh.length > 0) markRead(fresh[0].id);
  }, [markRead]);

  useEffect(() => {
    if (!session) {
      setQueue([]);
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
          if (!n.active) return;
          if (getDismissed().includes(n.id)) return;
          setQueue((q) => {
            if (q.some((x) => x.id === n.id)) return q;
            const next = [...q, n].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
            return next;
          });
          markRead(n.id);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, markRead, session?.id]);

  const advance = () => {
    if (!current) return;
    rememberDismissed(current.id);
    setQueue((q) => {
      const rest = q.slice(1);
      if (rest.length > 0) markRead(rest[0].id);
      return rest;
    });
  };

  if (!session || !current) return null;
  const { title, body } = localize(current, lang);
  const total = queue.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={advance}
      role="dialog"
      aria-modal="true"
      aria-label={t.notif.title}
    >
      <div
        className="notif-pop w-full max-w-md overflow-hidden rounded-[1.75rem] border shadow-2xl"
        style={{ borderColor: "var(--gold)", background: "var(--bg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* gold header band */}
        <div
          className="relative px-6 pb-5 pt-6"
          style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))" }}
        >
          <button
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/15 text-white transition hover:bg-black/25"
            onClick={advance}
            aria-label={t.auth.close}
          >
            <X size={15} />
          </button>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white">
            <BellRing size={22} />
          </span>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-white/85">
            {t.notif.title}
            {current.user_id ? ` · ${t.alert.privateShort}` : ""}
          </p>
          <h2 className="font-serif-d mt-1 text-2xl font-semibold leading-snug text-white">{title}</h2>
        </div>
        <div className="px-6 py-5">
          {current.user_id && (
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>
              <BellDot size={13} /> {t.alert.private}
            </p>
          )}
          <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {body}
          </p>
          <p className="mt-3 text-[11px] tabular-nums" style={{ color: "var(--muted)" }}>
            {new Date(current.created_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <button className="btn btn-gold flex-1" onClick={advance}>
              {total > 1 ? (
                <>
                  {t.notif.next} <ArrowRight size={15} />
                </>
              ) : (
                <>
                  <CheckCheck size={15} /> {t.notif.ok}
                </>
              )}
            </button>
            {total > 1 && (
              <span className="text-xs font-bold tabular-nums" style={{ color: "var(--muted)" }}>
                1 / {total}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
