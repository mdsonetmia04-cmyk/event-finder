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
import { MessageCircle, Play, Send } from "lucide-react";
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
      <section className="card flex flex-col p-4">
        <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
          <MessageCircle size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          {t.zoneChat.title}
        </h2>
        <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
          {t.zoneChat.loading}
        </p>
      </section>
    );
  }

  return (
    <section className="card flex flex-col p-4">
      <h2 className="font-serif-d flex items-center gap-2 text-lg font-semibold">
        <MessageCircle size={19} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
        {t.zoneChat.title}
      </h2>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {t.zoneChat.zoneSub}
      </p>
      <div ref={scrollRef} className="mt-3 max-h-[60vh] min-h-72 flex-1 space-y-4 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t.zoneChat.loading}
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t.zoneChat.chatEmpty}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === session.id;
            const seen = seenCounts[m.id] ?? 0;
            const joinable = [...new Set(extractRoomCodes(m.body))]
              .map((code) => openRooms.get(code))
              .filter((r): r is LudoRoom => Boolean(r));
            return (
              <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <LudoAvatar url={m.avatar_url} name={m.name} size={32} />
                <div className={`max-w-[78%] min-w-0 ${mine ? "text-right" : ""}`}>
                  <p className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>
                    {m.name} · {formatChatTime(m.created_at)}
                  </p>
                  <p
                    className="mt-0.5 inline-block break-words rounded-2xl px-3 py-1.5 text-left text-sm leading-relaxed"
                    style={{
                      background: mine ? "var(--gold)" : "var(--surface2)",
                      color: mine ? "#FFF9EC" : "var(--text)",
                    }}
                  >
                    {renderSegments(splitByRoomCodes(m.body))}
                  </p>
                  {joinable.map((room) => (
                    <div key={room.id} className={`mt-1.5 ${mine ? "flex justify-end" : ""}`}>
                      <Link
                        href={`/games/ludo/room/${room.id}`}
                        className="chip !py-1 text-xs font-bold"
                        style={{ borderColor: "var(--gold)", color: "var(--gold-deep)" }}
                      >
                        <Play size={12} aria-hidden="true" />
                        {t.zoneChat.joinRoom(room.code)}
                      </Link>
                    </div>
                  ))}
                  {seen > 0 && (
                    <p className="mt-1 text-[11px]" style={{ color: "var(--muted)" }}>
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
        <p role="alert" className="mt-3 text-sm font-medium" style={{ color: "#C44D45" }}>
          {t.zoneChat.sendFailed}
        </p>
      )}
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.zoneChat.composerPh}
          maxLength={ZONE_CHAT_MAX_CHARS}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm outline-none"
          style={{ borderColor: "var(--line)", background: "var(--surface)", color: "var(--text)" }}
        />
        <button type="submit" className="btn btn-gold shrink-0" disabled={sending || body.trim().length === 0}>
          <Send size={15} aria-hidden="true" />
          {t.zoneChat.send}
        </button>
      </form>
    </section>
  );
}
