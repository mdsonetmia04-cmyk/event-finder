"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, BellDot, BellRing, KeyRound, MessageCircle, Search, Send, ShieldCheck, Trash2, X, XCircle } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { AdminInbox } from "@/components/AdminChat";
import { getSupabase } from "@/lib/supabase";
import { EmptyState, SectionHeader } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import type { Profile } from "@/lib/supabase";
import { formatUsage, isLiveNow } from "@/lib/presence";

/** One-tap WhatsApp approval notification for an approved student.
    Opens wa.me with a pre-written Bengali message; the admin taps send in
    WhatsApp (fully automatic sending from a personal number risks a ban, so
    the send itself stays one tap). Marks the student notified afterwards. */
function WhatsAppNotifyButton({ user }: { user: Profile }) {
  const { t } = useLang();
  const [notified, setNotified] = useState(!!user.wa_notified);

  const send = async () => {
    const digits = user.whatsapp.replace(/\D/g, "");
    const intl = digits.startsWith("880") ? digits : digits.startsWith("0") ? `880${digits.slice(1)}` : `880${digits}`;
    const name = (user.full_name && user.full_name.trim()) || user.name;
    const msg =
      `আসসালামু আলাইকুম ${name}! 🎉\n\n` +
      `Sweet Smart Calendar (Microstock Journey with Sonet)-এ আপনার রেজিস্ট্রেশন অনুমোদিত হয়েছে।\n\n` +
      `এখন লগইন করুন: https://sweet-smart-calendar.vercel.app`;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("profiles").update({ wa_notified: true }).eq("id", user.id);
    }
    setNotified(true);
  };

  return (
    <button
      className="btn !px-2 !py-1.5"
      title={notified ? t.admin.waNotified : `${t.admin.waNotify}: ${user.name}`}
      aria-label={`${t.admin.waNotify}: ${user.name}`}
      onClick={send}
      style={
        notified
          ? { border: "1px solid #2F9E6E", color: "#2F9E6E" }
          : { border: "1px solid #2F9E6E", color: "#1f7a4d", background: "rgba(47,158,110,0.1)" }
      }
    >
      <Send size={13} />
      {notified && <span className="!text-[10px] font-bold">✓</span>}
    </button>
  );
}

function UserRow({  user,
  onApprove,
  onReject,
  onRemove,
  onChat,
  onInfo,
  onAlert,
}: {
  user: Profile;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
  onChat: () => void;
  onInfo: () => void;
  onAlert: () => void;
}) {
  const { t, lang } = useLang();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const date = new Date(user.created_at).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold leading-snug">
          {isLiveNow(user.last_seen) && (
            <span
              className="relative flex h-2.5 w-2.5 shrink-0"
              title={t.admin.liveNow}
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
          )}
          <button
            className="truncate text-left underline-offset-4 hover:underline"
            style={{ textDecorationColor: "var(--gold-1)" }}
            title={t.alert.infoTitle}
            onClick={onInfo}
          >
            {user.name}
          </button>
          {user.role === "super_admin" && (
            <span className="chip ml-2 !border-0 !text-[10px] font-bold" style={{ background: "rgba(201,151,31,.16)", color: "var(--gold-deep)" }}>
              <ShieldCheck size={11} /> {t.admin.superAdmin}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs tabular-nums" style={{ color: "var(--muted)" }}>
          {user.whatsapp} · {date} · ⏱ {t.admin.usageTime}: {formatUsage(user.total_seconds, lang)}
        </p>
        {(user.gmail || user.team_number || user.gender || user.blood_group || user.full_name || user.mobile_number || user.date_of_birth || user.district || user.last_education || user.skills_interests || user.facebook_link) && (
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: "var(--muted)" }}>
            {user.full_name && (
              <span>{t.profile.fullName}: <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.full_name}</strong></span>
            )}
            {user.gmail && <span className="tabular-nums">{user.gmail}</span>}
            {user.mobile_number && <span className="tabular-nums">📱 {user.mobile_number}</span>}
            {user.date_of_birth && <span>🎂 <span className="tabular-nums">{user.date_of_birth}</span></span>}
            {user.district && (
              <span>📍 <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.district}</strong></span>
            )}
            {user.last_education && (
              <span>🎓 <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.last_education}</strong></span>
            )}
            {user.skills_interests && (
              <span>✨ {user.skills_interests}</span>
            )}
            {user.facebook_link && (
              <a href={user.facebook_link} target="_blank" rel="noopener noreferrer" className="underline">🔗 Facebook</a>
            )}
            {user.team_number && (
              <span>{t.profile.teamNo}: <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.team_number}</strong></span>
            )}
            {user.gender && (
              <span>{t.profile.gender}: <strong className="font-semibold" style={{ color: "var(--ink)" }}>
                {user.gender === "male" ? t.profile.gMale : user.gender === "female" ? t.profile.gFemale : user.gender === "other" ? t.profile.gOther : user.gender}
              </strong></span>
            )}
            {user.blood_group && (
              <span>{t.profile.blood}: <strong className="font-semibold" style={{ color: "var(--ink)" }}>{user.blood_group}</strong></span>
            )}
          </p>
        )}
      </div>
      {user.role !== "super_admin" && (
        <div className="flex items-center gap-1.5">
          <button
            className="btn btn-ghost !px-2 !py-1.5"
            title={t.chat.title}
            aria-label={`${t.chat.title}: ${user.name}`}
            onClick={onChat}
          >
            <MessageCircle size={13} />
          </button>
          <button
            className="btn btn-ghost !px-2 !py-1.5"
            title={`${t.alert.btnTitle} — ${user.name}`}
            aria-label={`${t.alert.btn}: ${user.name}`}
            onClick={onAlert}
          >
            <BellDot size={13} />
          </button>
          {user.status === "pending" && (
            <>
              <button className="btn btn-gold !px-3 !py-1.5 !text-xs" onClick={onApprove}>
                <BadgeCheck size={13} /> {t.admin.approve}
              </button>
              <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={onReject}>
                <XCircle size={13} /> {t.admin.reject}
              </button>
            </>
          )}
          {user.status === "approved" && (
            <>
              <WhatsAppNotifyButton user={user} />
              <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={onReject}>
                <XCircle size={13} /> {t.admin.reject}
              </button>
            </>
          )}
          {user.status === "rejected" && (
            <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={onApprove}>
              <BadgeCheck size={13} /> {t.admin.approve}
            </button>
          )}
          <button
            className="btn btn-ghost !px-2 !py-1.5"
            title={t.admin.remove}
            aria-label={t.admin.remove}
            style={confirmingRemove ? { border: "1px solid #b3261e", color: "#b3261e" } : undefined}
            onClick={() => {
              if (confirmingRemove) {
                setConfirmingRemove(false);
                onRemove();
              } else {
                setConfirmingRemove(true);
                setTimeout(() => setConfirmingRemove(false), 5000);
              }
            }}
          >
            <Trash2 size={13} />
            {confirmingRemove && (
              <span className="!text-xs font-bold">{t.admin.sure}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/** Popup listing users — either everybody registered or only those live now.
    Every row has a chat icon that jumps straight to that student's thread. */
function UserListModal({
  mode,
  users,
  onClose,
  onChat,
  onInfo,
  onAlert,
}: {
  mode: "all" | "live";
  users: Profile[];
  onClose: () => void;
  onChat: (id: string) => void;
  onInfo: (user: Profile) => void;
  onAlert: (user: Profile) => void;
}) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  /* Tidy view: alphabetical by display name, with a live search box. */
  const list = useMemo(() => {
    const base = (mode === "live" ? users.filter((u) => isLiveNow(u.last_seen)) : users)
      .slice()
      .sort((a, b) =>
        ((a.full_name && a.full_name.trim()) || a.name).localeCompare(
          (b.full_name && b.full_name.trim()) || b.name,
          lang === "bn" ? "bn" : "en"
        )
      );
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((u) => `${u.name} ${u.full_name ?? ""} ${u.whatsapp}`.toLowerCase().includes(q));
  }, [mode, users, query, lang]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card flex max-h-[75vh] w-full max-w-lg flex-col overflow-hidden !p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-serif-d text-lg font-semibold">
            {mode === "live" ? t.admin.liveNow : t.admin.totalRegistered}
            <span className="kanban-count ml-2 tabular-nums">{list.length}</span>
          </h2>
          <button className="btn btn-ghost !px-2.5 !py-2" onClick={onClose} aria-label={t.auth.close}>
            <X size={16} />
          </button>
        </div>
        <div className="border-b px-4 py-2.5" style={{ borderColor: "var(--line)" }}>
          <label className="relative block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
            <input
              className="input !py-2 !pl-9 !text-sm"
              placeholder={t.admin.searchPh}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 ? (
            <p className="p-6 text-center text-sm" style={{ color: "var(--muted)" }}>
              {mode === "live" ? t.admin.noLive : t.admin.noUsers}
            </p>
          ) : (
            list.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 border-b px-4 py-3"
                style={{ borderColor: "var(--line)" }}
              >
                {isLiveNow(u.last_seen) && (
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <button
                    className="block max-w-full truncate text-left text-sm font-semibold underline-offset-4 hover:underline"
                    style={{ textDecorationColor: "var(--gold-1)" }}
                    title={t.alert.infoTitle}
                    onClick={() => onInfo(u)}
                  >
                    {u.name}
                  </button>
                  <p className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                    {u.whatsapp} · {u.status} · ⏱ {formatUsage(u.total_seconds, lang)}
                  </p>
                </div>
                {u.role !== "super_admin" && (
                  <>
                    <button
                      className="btn btn-ghost !px-2.5 !py-2"
                      title={t.chat.title}
                      aria-label={`${t.chat.title}: ${u.name}`}
                      onClick={() => onChat(u.id)}
                    >
                      <MessageCircle size={15} />
                    </button>
                    <button
                      className="btn btn-ghost !px-2.5 !py-2"
                      title={`${t.alert.btnTitle} — ${u.name}`}
                      aria-label={`${t.alert.btn}: ${u.name}`}
                      onClick={() => onAlert(u)}
                    >
                      <BellDot size={15} />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface AdminNotification {
  id: string;
  title: string;
  body: string;
  title_en?: string | null;
  body_en?: string | null;
  title_bn?: string | null;
  body_bn?: string | null;
  created_at: string;
  active: boolean;
  user_id: string | null;
}

/** Full student info popup — opened by clicking a student's name anywhere
    in the admin panel (user rows or the registered/live lists). */
function UserInfoModal({ user, onClose }: { user: Profile; onClose: () => void }) {
  const { t, lang } = useLang();
  const dateFmt = (d: string | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;
  const genderText = user.gender
    ? user.gender === "male"
      ? t.profile.gMale
      : user.gender === "female"
        ? t.profile.gFemale
        : user.gender === "other"
          ? t.profile.gOther
          : user.gender
    : null;
  const rows: [string, string][] = [
    [t.profile.name, user.name],
    [t.profile.whatsapp, user.whatsapp],
    [t.profile.gmail, user.gmail],
    [t.profile.fullName, user.full_name],
    [t.profile.mobile, user.mobile_number],
    [t.profile.dob, user.date_of_birth],
    [t.profile.district, user.district],
    [t.profile.education, user.last_education],
    [t.profile.skills, user.skills_interests],
    [t.profile.teamNo, user.team_number],
    [t.profile.gender, genderText],
    [t.profile.blood, user.blood_group],
    [t.profile.fbLink, user.facebook_link],
  ].filter(([, v]) => Boolean(v)) as [string, string][];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))" }}
            >
              {(user.name || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="font-serif-d truncate text-xl font-semibold">{user.name}</h2>
              <p className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                {isLiveNow(user.last_seen) && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                )}
                {user.role === "super_admin" ? t.admin.superAdmin : user.status}
                {" · "}
                {t.admin.usageTime}: {formatUsage(user.total_seconds, lang)}
              </p>
            </div>
          </div>
          <button className="btn btn-ghost !px-2.5 !py-2" onClick={onClose} aria-label={t.auth.close}>
            <X size={16} />
          </button>
        </div>
        <dl className="mt-4 grid gap-2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start gap-3 rounded-xl px-3 py-2" style={{ background: "var(--surface2)" }}>
              <dt className="w-28 shrink-0 text-xs" style={{ color: "var(--muted)" }}>
                {label}
              </dt>
              <dd className="min-w-0 flex-1 break-words text-sm font-medium">
                {label === t.profile.fbLink ? (
                  <a href={value} target="_blank" rel="noopener noreferrer" className="underline">
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
          <div className="flex items-start gap-3 rounded-xl px-3 py-2" style={{ background: "var(--surface2)" }}>
            <dt className="w-28 shrink-0 text-xs" style={{ color: "var(--muted)" }}>
              {t.admin.approvedT}
            </dt>
            <dd className="min-w-0 flex-1 text-sm font-medium tabular-nums">{dateFmt(user.created_at)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/** Private alert composer — sends a notification that ONLY the chosen
    student sees, shown to them like an announcement on top. */
function AlertComposer({ user, onClose }: { user: Profile; onClose: () => void }) {
  const { t } = useLang();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");

  const send = async () => {
    const supabase = getSupabase();
    if (!supabase || state !== "idle" || !title.trim() || !body.trim()) return;
    setState("sending");
    const { error } = await supabase.from("admin_notifications").insert({
      title: title.trim().slice(0, 200),
      body: body.trim().slice(0, 2000),
      user_id: user.id,
      active: true,
    });
    if (error) {
      setState("idle");
      return;
    }
    setState("sent");
    setTimeout(onClose, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif-d flex items-center gap-2 text-xl font-semibold">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))" }}
            >
              <BellDot size={18} />
            </span>
            {t.alert.composerT(user.name)}
          </h2>
          <button className="btn btn-ghost !px-2.5 !py-2" onClick={onClose} aria-label={t.auth.close}>
            <X size={16} />
          </button>
        </div>
        {state === "sent" ? (
          <p className="mt-6 rounded-xl p-4 text-center text-sm font-semibold" style={{ background: "var(--surface2)", color: "#2F9E6E" }}>
            ✓ {t.alert.sent}
          </p>
        ) : (
          <div className="mt-4 grid gap-2.5">
            <input
              className="input"
              placeholder={t.alert.titlePh}
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="input min-h-[100px] resize-y"
              placeholder={t.alert.bodyPh(user.name)}
              value={body}
              maxLength={2000}
              onChange={(e) => setBody(e.target.value)}
            />
            <button
              className="btn btn-gold"
              onClick={send}
              disabled={state !== "idle" || !title.trim() || !body.trim()}
            >
              <BellDot size={14} /> {state === "sending" ? t.alert.sending : t.alert.send}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Super-admin broadcast notifications: publish a popup that every website visitor sees. */
function AdminNotifications({ users }: { users: Profile[] }) {
  const { t, lang } = useLang();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [readCounts, setReadCounts] = useState<Record<string, number>>({});
  const [titleEn, setTitleEn] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [bodyBn, setBodyBn] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const [{ data }, { data: reads }] = await Promise.all([
      supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("notification_reads").select("notification_id"),
    ]);
    if (data) setItems(data as AdminNotification[]);
    const counts: Record<string, number> = {};
    for (const r of (reads ?? []) as { notification_id: string }[]) {
      counts[r.notification_id] = (counts[r.notification_id] ?? 0) + 1;
    }
    setReadCounts(counts);
  };

  useEffect(() => {
    load();
  }, []);

  const enDone = titleEn.trim() && bodyEn.trim();
  const bnDone = titleBn.trim() && bodyBn.trim();

  const publish = async () => {
    const supabase = getSupabase();
    if (!supabase || sending || (!enDone && !bnDone)) return;
    setSending(true);
    const te = titleEn.trim().slice(0, 200);
    const be = bodyEn.trim().slice(0, 2000);
    const tb = titleBn.trim().slice(0, 200);
    const bb = bodyBn.trim().slice(0, 2000);
    await supabase.from("admin_notifications").insert({
      // legacy single-language columns keep the first available version
      title: te || tb,
      body: be || bb,
      title_en: te || null,
      body_en: be || null,
      title_bn: tb || null,
      body_bn: bb || null,
      active: true,
    });
    setTitleEn("");
    setBodyEn("");
    setTitleBn("");
    setBodyBn("");
    await load();
    setSending(false);
  };

  const remove = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from("admin_notifications").delete().eq("id", id);
    // Also clear it from every visitor's dismissed cache effect: nothing needed,
    // the popup only shows active notifications fetched live.
    await load();
  };

  const approvedTotal = users.filter((u) => u.status === "approved").length;

  return (
    <div className="card p-5">
      <div className="grid gap-2.5">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          English
        </p>
        <input
          className="input"
          placeholder={t.notif.titlePh}
          value={titleEn}
          maxLength={200}
          onChange={(e) => setTitleEn(e.target.value)}
        />
        <textarea
          className="input min-h-[64px] resize-y"
          placeholder={t.notif.bodyPh}
          value={bodyEn}
          maxLength={2000}
          onChange={(e) => setBodyEn(e.target.value)}
        />
        <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          বাংলা
        </p>
        <input
          className="input"
          placeholder={t.notif.titlePh}
          value={titleBn}
          maxLength={200}
          onChange={(e) => setTitleBn(e.target.value)}
        />
        <textarea
          className="input min-h-[64px] resize-y"
          placeholder={t.notif.bodyPh}
          value={bodyBn}
          maxLength={2000}
          onChange={(e) => setBodyBn(e.target.value)}
        />
        <div>
          <button className="btn btn-gold" onClick={publish} disabled={sending || (!enDone && !bnDone)}>
            <BellRing size={14} /> {t.notif.publish}
          </button>
        </div>
      </div>
      {items.length > 0 && (
        <div className="mt-4 grid gap-2">
          {items.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--surface2)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title_en || n.title_bn || n.title}</p>
                {n.user_id && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--gold-deep)" }}>
                    <BellDot size={12} /> {t.alert.to(users.find((u) => u.id === n.user_id)?.name ?? "…")}
                  </p>
                )}
                <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: "var(--muted)" }}>{n.body_en || n.body_bn || n.body}</p>
                <p className="mt-1 flex items-center gap-2 text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                  <span>
                    {new Date(n.created_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
                      day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
                    })}
                  </span>
                  <span className="font-bold" style={{ color: "var(--gold-deep)" }}>
                    {t.notif.readBy(readCounts[n.id] ?? 0, n.user_id ? 1 : Math.max(approvedTotal, 1))}
                  </span>
                </p>
              </div>
              <button
                className="btn btn-ghost !px-2 !py-1.5"
                title={t.notif.delete}
                aria-label={t.notif.delete}
                onClick={() => remove(n.id)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { ready, session, users, approve, reject, removeUser, changePassword, refreshUsers } = useAuth();
  const { t, lang } = useLang();
  const router = useRouter();
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState<"ok" | "short" | null>(null);
  const [, setTick] = useState(0);
  const [listView, setListView] = useState<null | "all" | "live">(null);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [infoUser, setInfoUser] = useState<Profile | null>(null);
  const [alertUser, setAlertUser] = useState<Profile | null>(null);
  const [approvedQuery, setApprovedQuery] = useState("");
  const [approvedSort, setApprovedSort] = useState<"az" | "newest">("az");
  const inboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && session?.role !== "super_admin") router.replace("/");
  }, [ready, session, router]);

  // Refresh presence data every 30s so "live now" stays current; the tick
  // re-renders so the 3-minute live window expires without a reload.
  useEffect(() => {
    if (session?.role !== "super_admin") return;
    const timer = setInterval(() => {
      refreshUsers();
      setTick((n) => n + 1);
    }, 30_000);
    return () => clearInterval(timer);
  }, [session?.role, refreshUsers]);

  if (!ready || session?.role !== "super_admin") return null;

  const pending = users.filter((u) => u.status === "pending");
  const approved = users.filter((u) => u.status === "approved");
  const rejected = users.filter((u) => u.status === "rejected");
  const liveCount = users.filter((u) => isLiveNow(u.last_seen)).length;

  /* Tidy approved list: search + alphabetical (default) or newest-first sort. */
  const approvedSorted = useMemo(() => {
    const q = approvedQuery.trim().toLowerCase();
    const filtered = q
      ? approved.filter((u) => `${u.name} ${u.full_name ?? ""} ${u.whatsapp}`.toLowerCase().includes(q))
      : approved.slice();
    return filtered.sort((a, b) =>
      approvedSort === "az"
        ? ((a.full_name && a.full_name.trim()) || a.name).localeCompare(
            (b.full_name && b.full_name.trim()) || b.name,
            lang === "bn" ? "bn" : "en"
          )
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [approved, approvedQuery, approvedSort, lang]);

  /** Open a chat thread with a student: jump the inbox to them and scroll to it. */
  const openChat = (userId: string) => {
    setListView(null);
    setChatUserId(userId);
    requestAnimationFrame(() => {
      inboxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const savePw = async () => {
    if (newPw.length < 6) {
      setPwMsg("short");
      return;
    }
    await changePassword(newPw);
    setNewPw("");
    setPwMsg("ok");
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title={t.admin.title} subtitle={t.admin.sub} />

      {/* Registration + presence stats (click to see the lists) */}
      <section className="grid grid-cols-2 gap-3">
        <button className="card p-5 text-left transition hover:scale-[1.02]" onClick={() => setListView("all")}>
          <p className="label">{t.admin.totalRegistered}</p>
          <p className="font-serif-d mt-1 text-4xl font-semibold tabular-nums">{users.length}</p>
        </button>
        <button className="card p-5 text-left transition hover:scale-[1.02]" onClick={() => setListView("live")}>
          <p className="label flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            {t.admin.liveNow}
          </p>
          <p className="font-serif-d mt-1 text-4xl font-semibold tabular-nums">{liveCount}</p>
        </button>
      </section>
      {listView && (
        <UserListModal
          mode={listView}
          users={users}
          onClose={() => setListView(null)}
          onChat={openChat}
          onInfo={setInfoUser}
          onAlert={setAlertUser}
        />
      )}
      {infoUser && (
        <UserInfoModal user={infoUser} onClose={() => setInfoUser(null)} />
      )}
      {alertUser && (
        <AlertComposer user={alertUser} onClose={() => setAlertUser(null)} />
      )}

      {/* Pending approvals */}
      <section>
        <h2 className="font-serif-d mb-3 text-lg font-semibold">
          {t.admin.pendingT} <span className="kanban-count tabular-nums">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <EmptyState title={t.admin.noPendingT} hint={t.admin.noPendingH} />
        ) : (
          <div className="grid gap-2.5">
            {pending.map((u) => (
              <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} onChat={() => openChat(u.id)} onInfo={() => setInfoUser(u)} onAlert={() => setAlertUser(u)} />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif-d text-lg font-semibold">
            {t.admin.approvedT} <span className="kanban-count tabular-nums">{approvedSorted.length}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input
                className="input !w-52 !py-2 !pl-9 !text-sm"
                placeholder={t.admin.searchPh}
                value={approvedQuery}
                onChange={(e) => setApprovedQuery(e.target.value)}
              />
            </label>
            <div className="flex overflow-hidden rounded-lg border" style={{ borderColor: "var(--line)" }} role="group" aria-label="Sort">
              {(["az", "newest"] as const).map((s) => (
                <button
                  key={s}
                  className={`px-3 py-2 text-xs font-semibold transition ${approvedSort === s ? "btn-gold" : ""}`}
                  style={approvedSort === s ? undefined : { color: "var(--muted)" }}
                  onClick={() => setApprovedSort(s)}
                >
                  {s === "az" ? t.admin.sortAZ : t.admin.sortNewest}
                </button>
              ))}
            </div>
          </div>
        </div>
        {approvedSorted.length === 0 ? (
          <EmptyState title={approvedQuery ? t.admin.noMatch : t.admin.noUsers} hint={approvedQuery ? "" : t.admin.noPendingH} />
        ) : (
          <div className="grid gap-2.5">
            {approvedSorted.map((u) => (
              <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} onChat={() => openChat(u.id)} onInfo={() => setInfoUser(u)} onAlert={() => setAlertUser(u)} />
            ))}
          </div>
        )}
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <h2 className="font-serif-d mb-3 text-lg font-semibold">
            {t.admin.rejectedT} <span className="kanban-count tabular-nums">{rejected.length}</span>
          </h2>
          <div className="grid gap-2.5">
            {rejected.map((u) => (
              <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} onChat={() => openChat(u.id)} onInfo={() => setInfoUser(u)} onAlert={() => setAlertUser(u)} />
            ))}
          </div>
        </section>
      )}

      {/* Messages from students */}
      <section ref={inboxRef} className="scroll-mt-6">
        <h2 className="font-serif-d mb-3 text-lg font-semibold">
          {t.chat.inboxT}
        </h2>
        <AdminInbox focusUserId={chatUserId} />
      </section>

      {/* Broadcast notification to all website visitors */}
      <section>
        <h2 className="font-serif-d mb-3 text-lg font-semibold">
          {t.notif.adminT}
        </h2>
        <AdminNotifications users={users} />
      </section>

      {/* Change admin password */}
      <section className="card p-5">
        <h2 className="font-serif-d mb-1 text-lg font-semibold">{t.admin.pwT}</h2>
        <p className="mb-3 text-sm" style={{ color: "var(--muted)" }}>{t.admin.pwH}</p>
        <div className="flex max-w-md flex-wrap items-center gap-2">
          <input
            type="password"
            className="input flex-1"
            placeholder={t.admin.pwPh}
            value={newPw}
            onChange={(e) => { setNewPw(e.target.value); setPwMsg(null); }}
            autoComplete="new-password"
          />
          <button className="btn btn-gold" onClick={savePw}>
            <KeyRound size={14} /> {t.admin.pwBtn}
          </button>
        </div>
        {pwMsg === "ok" && <p className="mt-2 text-sm font-semibold" style={{ color: "#2F9E6E" }}>{t.admin.pwOk}</p>}
        {pwMsg === "short" && <p className="mt-2 text-sm font-semibold" style={{ color: "#C0524D" }}>{t.auth.errPw}</p>}
      </section>
    </div>
  );
}
