"use client";

/* Game Chat: the Gaming Zone's shared inbox, embedded open on /games.
   - Messages: realtime INSERT subscription (same channel pattern as
     AdminChat), newest at the bottom, auto-scroll on new messages.
   - Ludo room codes in a message get a "Join room" chip, but only when
     the code matches a currently open (waiting + fresh) room — the room
     page itself handles joining for non-members.
   - Seen counts: opening the Gaming Zone records read rows for the
     messages on screen (mark_zone_chat_read RPC, author excluded
     server-side); the count beside each message is other readers,
     updated live. */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, MessageCircle, Play, Send } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { LudoAvatar } from "@/components/LudoGame";
import { isRoomFresh, parseRoom, type LudoRoom } from "@/lib/ludo/room";
import {
  extractRoomCodes,
  parseZoneChatMessage,
  splitByRoomCodes,
  ZONE_CHAT_LIMIT,
  ZONE_CHAT_MAX_CHARS,
  type BodySegment,
  type ZoneChatMessage,
} from "@/lib/zone-chat";

const ROOM_RESOLVE_MS = 30_000;
const SEEN_DEBOUNCE_MS = 600;

/** "14:32" in Dhaka time — stable, no ticking relative labels. */
function formatChatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });
}

export function GameChat() {
  const { t } = useLang();
  const { ready, session } = useAuth();

  const [messages, setMessages] = useState<ZoneChatMessage[]>([]);
  const [seenCounts, setSeenCounts] = useState<Record<number, number>>({});
  const [openRooms, setOpenRooms] = useState<Map<string, LudoRoom>>(new Map());
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ZoneChatMessage[]>([]);
  const markedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /* ------------------------- Load + live messages ------------------------- */
  useEffect(() => {
    if (!ready || !session) return;
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("zone_chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(ZONE_CHAT_LIMIT)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const parsed: ZoneChatMessage[] = [];
          for (const row of data as unknown[]) {
            const m = parseZoneChatMessage(row);
            if (m) parsed.push(m);
          }
          parsed.reverse();
          setMessages(parsed);
        }
        setLoading(false);
      });
    const channel = supabase
      .channel("zone-chat-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "zone_chat_messages" },
        (payload) => {
          const m = parseZoneChatMessage(payload.new);
          if (!m) return;
          // Dedupe by id: our own insert is appended locally on send, and
          // realtime can replay an event on reconnect.
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev.slice(-(ZONE_CHAT_LIMIT - 1)), m],
          );
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [ready, session]);

  /* ------------------------------ Seen counts ----------------------------- */
  const loadCounts = useCallback(async (ids: number[]) => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (ids.length === 0) {
      setSeenCounts({});
      return;
    }
    const { data, error } = await supabase.from("zone_chat_reads").select("message_id").in("message_id", ids);
    if (error || !data) return;
    const tally: Record<number, number> = {};
    for (const row of data as { message_id: number }[]) {
      tally[row.message_id] = (tally[row.message_id] ?? 0) + 1;
    }
    setSeenCounts(tally);
  }, []);

  useEffect(() => {
    void loadCounts(messages.map((m) => m.id));
  }, [messages, loadCounts]);

  useEffect(() => {
    if (!ready || !session) return;
    const supabase = getSupabase();
    if (!supabase) return;
    let timer: number | null = null;
    const channel = supabase
      .channel("zone-chat-reads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "zone_chat_reads" }, () => {
        if (timer !== null) window.clearTimeout(timer);
        timer = window.setTimeout(
          () => void loadCounts(messagesRef.current.map((m) => m.id)),
          SEEN_DEBOUNCE_MS,
        );
      })
      .subscribe();
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [ready, session, loadCounts]);

  /* --------------------------- Mark visible as read ------------------------ */
  const markVisible = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !session || document.hidden) return;
    const ids = messagesRef.current
      .filter((m) => m.user_id !== session.id && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (ids.length === 0) return;
    ids.forEach((id) => markedRef.current.add(id));
    const { error } = await supabase.rpc("mark_zone_chat_read", { p_message_ids: ids });
    if (error) ids.forEach((id) => markedRef.current.delete(id));
  }, [session]);

  useEffect(() => {
    void markVisible();
  }, [messages, markVisible]);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) void markVisible();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [markVisible]);

  /* ------------------------- Resolve open room codes ----------------------- */
  const resolveRooms = useCallback(async () => {
    const supabase = getSupabase();
    const codes = [...new Set(messagesRef.current.flatMap((m) => extractRoomCodes(m.body)))];
    if (!supabase || codes.length === 0) {
      setOpenRooms(new Map());
      return;
    }
    const { data, error } = await supabase
      .from("ludo_rooms")
      .select("*")
      .in("code", codes)
      .eq("status", "waiting");
    if (error || !data) return;
    const now = Date.now();
    const next = new Map<string, LudoRoom>();
    for (const row of data as unknown[]) {
      const room = parseRoom(row);
      if (room && isRoomFresh(room, now)) next.set(room.code, room);
    }
    setOpenRooms(next);
  }, []);

  useEffect(() => {
    void resolveRooms();
  }, [messages, resolveRooms]);

  useEffect(() => {
    const id = setInterval(() => void resolveRooms(), ROOM_RESOLVE_MS);
    return () => clearInterval(id);
  }, [resolveRooms]);

  /* -------------------------------- Auto-scroll ---------------------------- */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  /* ---------------------------------- Send --------------------------------- */
  const send = useCallback(async () => {
    const trimmed = body.trim();
    const supabase = getSupabase();
    if (!trimmed || sending || !session || !supabase) return;
    setSending(true);
    setSendError(false);
    const { data, error } = await supabase
      .from("zone_chat_messages")
      .insert({
        user_id: session.id,
        name: session.name,
        avatar_url: session.avatar_url ?? null,
        body: trimmed.slice(0, ZONE_CHAT_MAX_CHARS),
      })
      .select("*")
      .single();
    setSending(false);
    if (error || !data) {
      setSendError(true);
      return;
    }
    const parsed = parseZoneChatMessage(data);
    if (parsed) {
      setMessages((prev) => (prev.some((m) => m.id === parsed.id) ? prev : [...prev, parsed]));
    }
    setBody("");
  }, [body, sending, session]);

  const renderSegments = (segments: BodySegment[]) =>
    segments.map((seg, i) =>
      seg.code ? (
        <span key={i} className="font-mono font-bold tracking-wider underline underline-offset-2">
          {seg.text}
        </span>
      ) : (
        <span key={i}>{seg.text}</span>
      ),
    );

  if (!ready || !session) {
    return (
      <section className="card overflow-hidden">
        <div
          className="relative overflow-hidden px-4 py-4 sm:px-5"
          style={{
            background: "linear-gradient(120deg, #6B4A0F 0%, #A66A19 48%, #C18A3A 100%)",
            boxShadow: "inset 0 1px 0 rgba(255, 249, 236, 0.25)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{ background: "radial-gradient(320px 120px at 12% 0%, rgba(243, 217, 160, 0.35), transparent 65%)" }}
          />
          <h2 className="font-serif-d relative flex items-center gap-3 text-lg font-semibold" style={{ color: "#FFF9EC" }}>
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "rgba(255, 249, 236, 0.16)",
                boxShadow: "0 0 0 1px rgba(255, 249, 236, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25)",
              }}
            >
              <MessageCircle size={19} style={{ color: "#FFF9EC" }} aria-hidden="true" />
            </span>
            {t.zoneChat.title}
          </h2>
        </div>
        <p className="p-4 text-sm" style={{ color: "var(--muted)" }}>
          {t.zoneChat.loading}
        </p>
      </section>
    );
  }

  return (
    <section
      className="card flex flex-col overflow-hidden"
      style={{ boxShadow: "0 14px 34px -22px rgba(166, 106, 25, 0.45)" }}
    >
      {/* Gold-gradient header band with icon badge. */}
      <div
        className="relative overflow-hidden px-4 py-4 sm:px-5"
        style={{
          background: "linear-gradient(120deg, #6B4A0F 0%, #A66A19 48%, #C18A3A 100%)",
          boxShadow: "inset 0 1px 0 rgba(255, 249, 236, 0.25)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{ background: "radial-gradient(320px 120px at 12% 0%, rgba(243, 217, 160, 0.35), transparent 65%)" }}
        />
        <h2 className="font-serif-d relative flex items-center gap-3 text-lg font-semibold" style={{ color: "#FFF9EC" }}>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "rgba(255, 249, 236, 0.16)",
              boxShadow: "0 0 0 1px rgba(255, 249, 236, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <MessageCircle size={19} style={{ color: "#FFF9EC" }} aria-hidden="true" />
          </span>
          {t.zoneChat.title}
        </h2>
        <p className="relative mt-1.5 pl-[52px] text-sm leading-relaxed" style={{ color: "rgba(255, 249, 236, 0.88)" }}>
          {t.zoneChat.zoneSub}
        </p>
      </div>
      <div
        ref={scrollRef}
        className="chat-bg max-h-[60vh] min-h-72 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5"
        style={{ backgroundColor: "color-mix(in srgb, var(--gold) 4%, var(--surface))" }}
      >
        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t.zoneChat.loading}
          </p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "color-mix(in srgb, var(--gold) 12%, transparent)",
                boxShadow: "0 0 0 1px color-mix(in srgb, var(--gold) 30%, transparent), 0 6px 16px -8px rgba(166, 106, 25, 0.5)",
              }}
            >
              <MessageCircle size={24} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.zoneChat.chatEmpty}
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === session.id;
            const seen = seenCounts[m.id] ?? 0;
            const joinable = [...new Set(extractRoomCodes(m.body))]
              .map((code) => openRooms.get(code))
              .filter((r): r is LudoRoom => Boolean(r));
            return (
              <div key={m.id} className={`chat-msg flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <span className="shrink-0 pt-0.5">
                  <LudoAvatar
                    url={m.avatar_url}
                    name={m.name}
                    size={32}
                    ringColor="color-mix(in srgb, var(--gold) 55%, transparent)"
                  />
                </span>
                <div className={`max-w-[78%] min-w-0 ${mine ? "text-right" : ""}`}>
                  <p className="px-1 text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
                    {m.name} · {formatChatTime(m.created_at)}
                  </p>
                  <p
                    className="mt-1 inline-block break-words px-3.5 py-2 text-left text-sm leading-relaxed"
                    style={
                      mine
                        ? {
                            background: "linear-gradient(135deg, var(--gold-2), var(--gold))",
                            color: "#000",
                            borderRadius: 18,
                            borderBottomRightRadius: 6,
                            boxShadow: "0 3px 10px rgba(166, 106, 25, 0.3)",
                          }
                        : {
                            background: "var(--surface)",
                            color: "var(--text)",
                            borderRadius: 18,
                            borderBottomLeftRadius: 6,
                            border: "1px solid var(--line)",
                            boxShadow: "0 2px 8px rgba(33, 26, 20, 0.06)",
                          }
                    }
                  >
                    {renderSegments(splitByRoomCodes(m.body))}
                  </p>
                  {joinable.map((room) => (
                    <div key={room.id} className={`mt-1.5 ${mine ? "flex justify-end" : ""}`}>
                      <Link
                        href={`/games/ludo/room/${room.id}`}
                        className="chip !py-1 text-xs font-bold"
                        style={{
                          background: "linear-gradient(135deg, var(--gold-soft), var(--gold-2))",
                          borderColor: "var(--gold)",
                          color: "#201405",
                          boxShadow: "0 0 0 1px var(--gold), 0 4px 14px rgba(166, 106, 25, 0.35)",
                        }}
                      >
                        <Play size={12} aria-hidden="true" />
                        {t.zoneChat.joinRoom(room.code)}
                      </Link>
                    </div>
                  ))}
                  {seen > 0 && (
                    <p
                      className={`mt-1 flex items-center gap-1 px-1 text-[11px] ${mine ? "justify-end" : ""}`}
                      style={{ color: "var(--muted)" }}
                    >
                      <Eye size={12} aria-hidden="true" />
                      {t.zoneChat.seenBy(seen)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {sendError && (
        <p role="alert" className="px-4 pt-3 text-sm font-medium sm:px-5" style={{ color: "#C44D45" }}>
          {t.zoneChat.sendFailed}
        </p>
      )}
      <form
        className="border-t px-3 py-3 sm:px-4"
        style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div
          className="flex items-center gap-2 rounded-full border p-1.5 pl-4 transition-all focus-within:border-[var(--gold)] focus-within:shadow-[0_0_0_3px_rgba(193,138,58,0.25)]"
          style={{ borderColor: "var(--line)", background: "var(--card)", boxShadow: "0 2px 10px rgba(33, 26, 20, 0.05)" }}
        >
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t.zoneChat.composerPh}
            maxLength={ZONE_CHAT_MAX_CHARS}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
            style={{ color: "var(--text)" }}
          />
          <button
            type="submit"
            className="btn btn-gold shrink-0 !px-4 !py-2"
            style={{ boxShadow: "0 4px 14px rgba(166, 106, 25, 0.4)" }}
            disabled={sending || body.trim().length === 0}
          >
            <Send size={15} aria-hidden="true" />
            {t.zoneChat.send}
          </button>
        </div>
      </form>
    </section>
  );
}
