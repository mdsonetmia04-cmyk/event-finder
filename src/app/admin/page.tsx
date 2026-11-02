"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, BellRing, KeyRound, MessageCircle, ShieldCheck, Trash2, X, XCircle } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { AdminInbox } from "@/components/AdminChat";
import { getSupabase } from "@/lib/supabase";
import { EmptyState, SectionHeader } from "@/components/ui";
import { useLang } from "@/i18n/LanguageContext";
import type { Profile } from "@/lib/supabase";
import { formatUsage, isLiveNow } from "@/lib/presence";

function UserRow({
  user,
  onApprove,
  onReject,
  onRemove,
  onChat,
}: {
  user: Profile;
  onApprove: () => void;
  onReject: () => void;
  onRemove: () => void;
  onChat: () => void;
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
          <span className="truncate">{user.name}</span>
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
            <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={onReject}>
              <XCircle size={13} /> {t.admin.reject}
            </button>
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
}: {
  mode: "all" | "live";
  users: Profile[];
  onClose: () => void;
  onChat: (id: string) => void;
}) {
  const { t, lang } = useLang();
  const list = mode === "live" ? users.filter((u) => isLiveNow(u.last_seen)) : users;
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
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                    {u.whatsapp} · {u.status} · ⏱ {formatUsage(u.total_seconds, lang)}
                  </p>
                </div>
                {u.role !== "super_admin" && (
                  <button
                    className="btn btn-ghost !px-2.5 !py-2"
                    title={t.chat.title}
                    aria-label={`${t.chat.title}: ${u.name}`}
                    onClick={() => onChat(u.id)}
                  >
                    <MessageCircle size={15} />
                  </button>
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
  created_at: string;
  active: boolean;
}

/** Super-admin broadcast notifications: publish a popup that every website visitor sees. */
function AdminNotifications() {
  const { t, lang } = useLang();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setItems(data as AdminNotification[]);
  };

  useEffect(() => {
    load();
  }, []);

  const publish = async () => {
    const supabase = getSupabase();
    if (!supabase || !title.trim() || !body.trim() || sending) return;
    setSending(true);
    await supabase.from("admin_notifications").insert({
      title: title.trim().slice(0, 200),
      body: body.trim().slice(0, 2000),
      active: true,
    });
    setTitle("");
    setBody("");
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

  return (
    <div className="card p-5">
      <div className="grid gap-2.5">
        <input
          className="input"
          placeholder={t.notif.titlePh}
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input min-h-[84px] resize-y"
          placeholder={t.notif.bodyPh}
          value={body}
          maxLength={2000}
          onChange={(e) => setBody(e.target.value)}
        />
        <div>
          <button className="btn btn-gold" onClick={publish} disabled={sending || !title.trim() || !body.trim()}>
            <BellRing size={14} /> {t.notif.publish}
          </button>
        </div>
      </div>
      {items.length > 0 && (
        <div className="mt-4 grid gap-2">
          {items.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: "var(--surface2)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs" style={{ color: "var(--muted)" }}>{n.body}</p>
                <p className="mt-1 text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                  {new Date(n.created_at).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
                    day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
                  })}
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
        />
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
              <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} onChat={() => openChat(u.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Approved */}
      <section>
        <h2 className="font-serif-d mb-3 text-lg font-semibold">
          {t.admin.approvedT} <span className="kanban-count tabular-nums">{approved.length}</span>
        </h2>
        <div className="grid gap-2.5">
          {approved.map((u) => (
            <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} onChat={() => openChat(u.id)} />
          ))}
        </div>
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section>
          <h2 className="font-serif-d mb-3 text-lg font-semibold">
            {t.admin.rejectedT} <span className="kanban-count tabular-nums">{rejected.length}</span>
          </h2>
          <div className="grid gap-2.5">
            {rejected.map((u) => (
              <UserRow key={u.id} user={u} onApprove={() => approve(u.id)} onReject={() => reject(u.id)} onRemove={() => removeUser(u.id)} onChat={() => openChat(u.id)} />
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
        <AdminNotifications />
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
