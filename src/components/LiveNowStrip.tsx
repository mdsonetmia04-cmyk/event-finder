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
    <section
      className="card overflow-hidden"
      style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--gold) 9%, var(--card)), var(--card) 55%)",
        boxShadow: "0 10px 26px -20px rgba(166, 106, 25, 0.5)",
      }}
    >
      {/* Gold gradient top accent. */}
      <div
        className="h-[3px]"
        aria-hidden="true"
        style={{ background: "linear-gradient(90deg, var(--gold-soft), var(--gold) 55%, var(--gold-deep))" }}
      />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="live-dot shrink-0" aria-hidden="true" />
          <h2 className="font-serif-d text-base font-semibold">{t.zoneChat.liveTitle}</h2>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ background: "#237A44", color: "#fff", boxShadow: "0 0 10px rgba(35, 122, 68, 0.55)" }}
          >
            {t.zoneChat.livePill}
          </span>
          <span
            className="chip !py-0.5 text-[11px] font-semibold"
            style={{
              background: "color-mix(in srgb, var(--gold) 12%, transparent)",
              borderColor: "color-mix(in srgb, var(--gold) 35%, transparent)",
              color: "var(--gold-deep)",
            }}
          >
            {t.zoneChat.liveCount(liveUsers.length)}
          </span>
        </div>
        {liveUsers.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.zoneChat.liveEmpty}
          </p>
        ) : (
          <div
            className="mt-3 flex gap-4 overflow-x-auto pt-1 pb-1"
            style={{
              maskImage: "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)",
              WebkitMaskImage: "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)",
            }}
          >
            {liveUsers.map((u) => (
              <div
                key={u.user_id}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center transition-transform hover:-translate-y-0.5"
              >
                <span className="relative">
                  {/* Gradient gold avatar ring. */}
                  <span
                    className="block rounded-full p-[2.5px]"
                    style={{
                      background: "linear-gradient(135deg, #F3D9A0, #D9A044 50%, #A66A19)",
                      boxShadow: "0 3px 10px rgba(166, 106, 25, 0.35)",
                    }}
                  >
                    <LudoAvatar url={u.avatar_url} name={u.display_name} size={44} />
                  </span>
                  {/* Glowing live dot with a soft ping ring. */}
                  <span className="absolute right-0 bottom-0 h-3 w-3" aria-hidden="true">
                    <span
                      className="absolute inset-0 animate-ping rounded-full opacity-60"
                      style={{ background: "var(--ok)" }}
                    />
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{ background: "var(--ok)", boxShadow: "0 0 0 2px var(--surface), 0 0 8px var(--ok)" }}
                    />
                  </span>
                </span>
                <span className="w-full truncate text-xs font-semibold">
                  {u.display_name}
                  {u.user_id === session.id && (
                    <span
                      className="mx-auto mt-0.5 block w-fit rounded-full px-1.5 py-px text-[10px] font-bold"
                      style={{
                        background: "color-mix(in srgb, var(--gold) 14%, transparent)",
                        color: "var(--gold-deep)",
                      }}
                    >
                      {t.zoneChat.you}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
