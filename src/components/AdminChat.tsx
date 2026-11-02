"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, SendHorizonal } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase, type Profile } from "@/lib/supabase";

export interface ChatMessage {
  id: string;
  user_id: string;
  sender: "user" | "admin";
  body: string;
  created_at: string;
}

function fmtTime(iso: string, lang: string) {
  return new Date(iso).toLocaleString(lang === "bn" ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string, lang: string, t: { today: string; yesterday: string }) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff <= 0) return t.today;
  if (diff === 1) return t.yesterday;
  return d.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Shared message bubble list + composer, used by both the student chatbox and the admin inbox.
    Premium look: day dividers, peer avatars with name badges, gold own-bubbles
    with sent ticks, slide-in animation on new messages. */
export function ChatThread({
  messages,
  onSend,
  sending,
  isAdminView,
  emptyHint,
  peerName,
  peerInitial,
  peerIsAdmin,
}: {
  messages: ChatMessage[];
  onSend: (body: string) => Promise<void>;
  sending: boolean;
  isAdminView: boolean;
  emptyHint: string;
  peerName?: string;
  peerInitial?: string;
  peerIsAdmin?: boolean;
}) {
  const { t, lang } = useLang();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const firstLoad = useRef(true);
  // Synchronous re-entry guard: the `sending` prop updates async via the
  // parent, so rapid clicks / Enter key-repeat could fire several inserts
  // before it flips. This ref blocks them immediately.
  const busyRef = useRef(false);

  // Scroll the message list itself (never the whole page): on first load jump
  // straight to the bottom, afterwards animate. This keeps the contact page
  // from yanking visitors down to the chatbox when it opens.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (firstLoad.current) {
      el.scrollTop = el.scrollHeight;
      firstLoad.current = false;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending || busyRef.current) return;
    busyRef.current = true;
    setDraft("");
    try {
      await onSend(body);
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} className="chat-bg flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="m-auto flex max-w-[240px] flex-col items-center gap-2 text-center">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
              style={{ background: "rgba(201,151,31,.14)" }}
            >
              💬
            </span>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.chat.startConvo}
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          // In the student view the student's own messages sit on the right;
          // in the admin view the admin's replies sit on the right.
          const mine = isAdminView ? m.sender === "admin" : m.sender === "user";
          const prev = messages[i - 1];
          const newDay = !prev || dayKey(m.created_at) !== dayKey(prev.created_at);
          const newGroup = !prev || prev.sender !== m.sender || newDay;
          const optimistic = m.id.startsWith("temp-");
          return (
            <div key={m.id}>
              {newDay && (
                <div className="my-2 flex justify-center">
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{ background: "var(--surface2)", color: "var(--muted)", border: "1px solid var(--line)" }}
                  >
                    {dayLabel(m.created_at, lang, t.chat)}
                  </span>
                </div>
              )}
              <div className={`chat-msg flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={
                      newGroup
                        ? peerIsAdmin
                          ? { background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))" }
                          : { background: "linear-gradient(135deg, #8a6d3b, #5c4a26)" }
                        : { visibility: "hidden" }
                    }
                    aria-hidden="true"
                  >
                    {peerInitial ?? "•"}
                  </span>
                )}
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && newGroup && peerName && (
                    <p className="mb-0.5 ml-1 flex items-center gap-1 text-[11px] font-bold" style={{ color: "var(--muted)" }}>
                      {peerName}
                      {peerIsAdmin && (
                        <span
                          className="rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white"
                          style={{ background: "var(--gold-deep)" }}
                        >
                          {t.chat.adminBadge}
                        </span>
                      )}
                    </p>
                  )}
                  <div
                    className="px-3.5 py-2 text-sm leading-relaxed"
                    style={
                      mine
                        ? {
                            background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))",
                            color: "#000",
                            borderRadius: 18,
                            borderBottomRightRadius: 6,
                            boxShadow: "0 2px 8px rgba(166,106,25,.25)",
                          }
                        : {
                            background: "var(--surface2)",
                            color: "var(--text)",
                            borderRadius: 18,
                            borderBottomLeftRadius: 6,
                            border: "1px solid var(--line)",
                          }
                    }
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  </div>
                  <p
                    className="mt-0.5 flex items-center gap-1 px-1 text-[10px] tabular-nums"
                    style={{ color: "var(--muted)" }}
                  >
                    {fmtTime(m.created_at, lang)}
                    {mine && (
                      <span title={optimistic ? t.chat.sending : t.chat.sent} aria-label={optimistic ? t.chat.sending : t.chat.sent}>
                        {optimistic ? "🕐" : "✓✓"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
        <input
          className="input !rounded-full flex-1"
          placeholder={t.chat.placeholder}
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          className="btn btn-gold !rounded-full !px-4"
          onClick={send}
          disabled={sending || busyRef.current || !draft.trim()}
          aria-label={t.chat.send}
        >
          <SendHorizonal size={16} />
        </button>
      </div>
    </div>
  );
}

/** Student-facing "Chat with Admin" panel, embedded directly on the contact page.
    Students write here; the super admin reads and replies from the admin panel. */
export function StudentChatBox() {
  const { t } = useLang();
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    const { data } = await supabase
      .from("admin_messages")
      .select("*")
      .eq("user_id", session.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data as ChatMessage[]);
  }, [session]);

  useEffect(() => {
    load();
    const supabase = getSupabase();
    if (!supabase || !session) return;
    const channel = supabase
      .channel(`admin-chat-${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_messages", filter: `user_id=eq.${session.id}` },
        (payload) => {
          const nm = payload.new as ChatMessage;
          // Dedupe by id: the optimistic bubble is already swapped for the
          // real row, and realtime can replay an event on reconnect.
          setMessages((prev) => (prev.some((m) => m.id === nm.id) ? prev : [...prev, nm]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, load]);

  const send = async (body: string) => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    // Optimistic: show the message instantly so the sender never wonders
    // whether the click worked (the old delay is what caused re-clicks).
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: ChatMessage = {
      id: tempId,
      user_id: session.id,
      sender: "user",
      body: body.slice(0, 2000),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    const { data, error } = await supabase
      .from("admin_messages")
      .insert({ user_id: session.id, sender: "user", body: body.slice(0, 2000) })
      .select()
      .single();
    if (!error && data) {
      const real = data as ChatMessage;
      // Swap the optimistic bubble for the real row; the realtime event for
      // this insert is deduped by id below, so it never renders twice.
      setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    setSending(false);
  };

  return (
    <div
      className="card flex h-[440px] flex-col overflow-hidden !p-0"
    >
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))", color: "#fff" }}
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 text-lg font-bold">
          S
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2"
            style={{ background: "#22c55e", borderColor: "var(--gold-1)" }}
          />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{t.chat.title}</p>
          <p className="text-xs opacity-90">{t.chat.onlineNow}</p>
        </div>
        <MessageCircle size={18} className="ml-auto shrink-0 opacity-80" />
      </div>
      <ChatThread
        messages={messages}
        onSend={send}
        sending={sending}
        isAdminView={false}
        emptyHint={t.chat.emptyStudent}
        peerName={t.chat.adminBadge}
        peerInitial="S"
        peerIsAdmin
      />
    </div>
  );
}

/** Super-admin inbox: every student thread, with reply. Rendered inside the admin panel.
    `focusUserId` jumps straight to that student's thread (e.g. from a chat icon). */
export function AdminInbox({ focusUserId }: { focusUserId?: string | null }) {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const [{ data: msgs }, { data: profs }] = await Promise.all([
      supabase.from("admin_messages").select("*").order("created_at", { ascending: true }).limit(1000),
      supabase.from("profiles").select("*"),
    ]);
    if (msgs) setMessages(msgs as ChatMessage[]);
    if (profs) {
      const map: Record<string, Profile> = {};
      (profs as Profile[]).forEach((p) => {
        map[p.id] = p;
      });
      setProfiles(map);
    }
  }, []);

  useEffect(() => {
    load();
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("admin-chat-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "admin_messages" },
        (payload) => {
          const nm = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === nm.id) ? prev : [...prev, nm]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Group into threads, newest activity first
  const threads = (() => {
    const byUser = new Map<string, ChatMessage[]>();
    messages.forEach((m) => {
      const list = byUser.get(m.user_id) ?? [];
      list.push(m);
      byUser.set(m.user_id, list);
    });
    return [...byUser.entries()]
      .map(([userId, list]) => ({ userId, list, last: list[list.length - 1] }))
      .sort((a, b) => b.last.created_at.localeCompare(a.last.created_at));
  })();

  useEffect(() => {
    if (!activeId && threads.length > 0) setActiveId(threads[0].userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Jump to a specific student's thread when requested (chat icon click)
  useEffect(() => {
    if (focusUserId && threads.some((th) => th.userId === focusUserId)) {
      setActiveId(focusUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusUserId, messages.length]);

  const active = threads.find((th) => th.userId === activeId);

  const reply = async (body: string) => {
    const supabase = getSupabase();
    if (!supabase || !activeId) return;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: ChatMessage = {
      id: tempId,
      user_id: activeId,
      sender: "admin",
      body: body.slice(0, 2000),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);
    const { data, error } = await supabase
      .from("admin_messages")
      .insert({ user_id: activeId, sender: "admin", body: body.slice(0, 2000) })
      .select()
      .single();
    if (!error && data) {
      const real = data as ChatMessage;
      setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
    setSending(false);
  };

  if (threads.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {t.chat.noThreads}
      </p>
    );
  }

  return (
    <div className="card grid overflow-hidden !p-0 md:grid-cols-[260px_1fr]" style={{ minHeight: 420 }}>
      <div className="max-h-[420px] overflow-y-auto border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--line)" }}>
        {threads.map((th) => {
          const p = profiles[th.userId];
          const unread = th.list.filter((m) => m.sender === "user").length > 0 && th.last.sender === "user";
          return (
            <button
              key={th.userId}
              onClick={() => setActiveId(th.userId)}
              className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              style={{
                borderColor: "var(--line)",
                background: th.userId === activeId ? "var(--surface2)" : undefined,
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))" }}
              >
                {(p?.name ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{p?.name ?? th.userId.slice(0, 8)}</span>
                  {unread && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--gold-1)" }} />}
                </span>
                <span className="block truncate text-xs" style={{ color: "var(--muted)" }}>
                  {th.last.sender === "admin" ? `${t.chat.you}: ` : ""}
                  {th.last.body}
                </span>
                <span className="text-[10px] tabular-nums" style={{ color: "var(--muted)" }}>
                  {fmtTime(th.last.created_at, lang)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex min-h-[420px] flex-col">
        {active ? (
          <>
            <div className="border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
              <p className="text-sm font-semibold">{profiles[active.userId]?.name}</p>
              <p className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
                {profiles[active.userId]?.whatsapp}
              </p>
            </div>
            <ChatThread
              messages={active.list}
              onSend={reply}
              sending={sending}
              isAdminView
              emptyHint={t.chat.emptyStudent}
              peerName={profiles[active.userId]?.name ?? t.chat.adminBadge}
              peerInitial={(profiles[active.userId]?.name ?? "?").charAt(0).toUpperCase()}
            />
          </>
        ) : (
          <p className="m-auto text-sm" style={{ color: "var(--muted)" }}>
            {t.chat.pickThread}
          </p>
        )}
      </div>
    </div>
  );
}
