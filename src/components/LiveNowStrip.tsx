"use client";

/* Live-now strip for the top of the Gaming Zone page: one horizontal row
   of everyone currently active on the website — avatar + name + green
   dot. Liveness reuses the heartbeat signal: get_live_users RPC, the
   same 3-minute "live now" window as src/lib/presence.ts. Demo accounts
   are excluded server-side; name + pic only — never phone numbers, same
   rule as the leaderboard. */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { LudoAvatar } from "@/components/LudoGame";
import { isLiveNow } from "@/lib/presence";
import { parseLiveUser, type LiveUser } from "@/lib/zone-chat";

const LIVE_POLL_MS = 30_000;

export function LiveNowStrip() {
  const { t } = useLang();
  const { ready, session } = useAuth();
  const [liveUsers, setLiveUsers] = useState<LiveUser[]>([]);

  const loadLive = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("get_live_users");
    if (error || !data) return;
    const users: LiveUser[] = [];
    for (const row of data as unknown[]) {
      const u = parseLiveUser(row);
      if (u && isLiveNow(u.last_seen)) users.push(u);
    }
    setLiveUsers(users);
  }, []);

  useEffect(() => {
    if (!ready || !session) return;
    void loadLive();
    const id = setInterval(() => void loadLive(), LIVE_POLL_MS);
    return () => clearInterval(id);
  }, [ready, session, loadLive]);

  if (!ready || !session) return null;

  return (
    <section className="card p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full" style={{ background: "#2FA36B" }} aria-hidden="true" />
        <h2 className="font-serif-d text-base font-semibold">{t.zoneChat.liveTitle}</h2>
        <span className="chip !py-0.5 text-[11px]">{t.zoneChat.liveCount(liveUsers.length)}</span>
      </div>
      {liveUsers.length === 0 ? (
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          {t.zoneChat.liveEmpty}
        </p>
      ) : (
        <div className="mt-3 flex gap-4 overflow-x-auto pb-1">
          {liveUsers.map((u) => (
            <div key={u.user_id} className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
              <span className="relative">
                <LudoAvatar url={u.avatar_url} name={u.display_name} size={44} />
                <span
                  className="absolute right-0 bottom-0 h-3 w-3 rounded-full"
                  style={{ background: "#2FA36B", boxShadow: "0 0 0 2px var(--surface)" }}
                  aria-hidden="true"
                />
              </span>
              <span className="w-full truncate text-xs font-medium">
                {u.display_name}
                {u.user_id === session.id && (
                  <span className="block text-[10px] font-bold" style={{ color: "var(--gold-deep)" }}>
                    {t.zoneChat.you}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
