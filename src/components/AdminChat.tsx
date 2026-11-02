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
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Shared message bubble list + composer, used by both the student chatbox and the admin inbox. */
export function ChatThread({
  messages,
  onSend,
  sending,
  isAdminView,
  emptyHint,
}: {
  messages: ChatMessage[];
  onSend: (body: string) => Promise<void>;
  sending: boolean;
  isAdminView: boolean;
  emptyHint: string;
}) {
  const { t, lang } = useLang();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setDraft("");
    await onSend(body);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="my-auto text-center text-sm" style={{ color: "var(--muted)" }}>
            {emptyHint}
          </p>
        )}
        {messages.map((m) => {
          // In the student view the student's own messages sit on the right;
          // in the admin view the admin's replies sit on the right.
          const mine = isAdminView ? m.sender === "admin" : m.sender === "user";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed"
                style={
                  mine
                    ? { background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))", color: "#fff", borderBottomRightRadius: 6 }
                    : { background: "var(--surface2)", color: "var(--text)", borderBottomLeftRadius: 6 }
                }
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className="mt-1 text-right text-[10px] tabular-nums"
                  style={{ color: mine ? "rgba(255,255,255,.75)" : "var(--muted)" }}
                >
                  {fmtTime(m.created_at, lang)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t p-3" style={{ borderColor: "var(--line)" }}>
        <input
          className="input flex-1"
          placeholder={t.chat.placeholder}
          value={draft}
          maxLength={2000}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button
          className="btn btn-gold !px-3.5"
          onClick={send}
          disabled={sending || !draft.trim()}
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
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, load]);

  const send = async (body: string) => {
    const supabase = getSupabase();
    if (!supabase || !session) return;
    setSending(true);
    await supabase.from("admin_messages").insert({
      user_id: session.id,
      sender: "user",
      body: body.slice(0, 2000),
    });
    // Optimistic reload in case realtime is not yet attached
    await load();
    setSending(false);
  };

  return (
    <div
      className="card flex h-[440px] flex-col overflow-hidden !p-0"
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ background: "linear-gradient(135deg, var(--gold-2), var(--gold-1))", color: "#fff" }}
      >
        <MessageCircle size={18} />
        <p className="font-semibold">{t.chat.title}</p>
      </div>
      <ChatThread
        messages={messages}
        onSend={send}
        sending={sending}
        isAdminView={false}
        emptyHint={t.chat.emptyStudent}
      />
    </div>
  );
}

/** Super-admin inbox: every student thread, with reply. Rendered inside the admin panel. */
export function AdminInbox() {
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
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
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

  const active = threads.find((th) => th.userId === activeId);

  const reply = async (body: string) => {
    const supabase = getSupabase();
    if (!supabase || !activeId) return;
    setSending(true);
    await supabase.from("admin_messages").insert({
      user_id: activeId,
      sender: "admin",
      body: body.slice(0, 2000),
    });
    await load();
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
