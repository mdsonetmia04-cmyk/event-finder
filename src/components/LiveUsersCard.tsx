"use client";

/* Tall live-users card for the right side of the Gaming Zone page: two
   lists ("serials") in one card, game-card styling.
   - Serial 1: everyone currently live on the website (site-wide).
   - Serial 2: the subset currently inside the Gaming Zone — their last
     heartbeat came from a page under /games (migration v14 last_path).
   Each entry is avatar + name + green live dot. Liveness reuses the
   heartbeat signal: get_live_users RPC, the same 3-minute "live now"
   window as src/lib/presence.ts. Demo accounts are excluded
   server-side; name + pic only — never phone numbers, same rule as
   the leaderboard. */

import { useCallback, useEffect, useState } from "react";
import { Gamepad2, Users } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useLang } from "@/i18n/LanguageContext";
import { getSupabase } from "@/lib/supabase";
import { LudoAvatar } from "@/components/LudoGame";
import { isLiveNow } from "@/lib/presence";
import { parseLiveUser, type LiveUser } from "@/lib/zone-chat";

const LIVE_POLL_MS = 30_000;

function LiveUserRow({ user, isYou, youLabel }: { user: LiveUser; isYou: boolean; youLabel: string }) {
  return (
    <li className="flex min-w-0 items-center gap-3">
      <span className="relative shrink-0">
        {/* Gradient gold avatar ring. */}
        <span
          className="block rounded-full p-[2.5px]"
          style={{
            background: "linear-gradient(135deg, #F3D9A0, #D9A044 50%, #A66A19)",
            boxShadow: "0 3px 10px rgba(166, 106, 25, 0.35)",
          }}
        >
          <LudoAvatar url={user.avatar_url} name={user.display_name} size={40} />
        </span>
        {/* Glowing live dot with a soft ping ring. */}
        <span className="absolute right-0 bottom-0 h-2.5 w-2.5" aria-hidden="true">
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
      <span className="min-w-0 truncate text-sm font-semibold">{user.display_name}</span>
      {isYou && (
        <span
          className="shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold"
          style={{
            background: "color-mix(in srgb, var(--gold) 14%, transparent)",
            color: "var(--gold-deep)",
          }}
        >
          {youLabel}
        </span>
      )}
    </li>
  );
}

export function LiveUsersCard() {
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

  const inZone = liveUsers.filter((u) => u.in_zone);
  const countChipStyle = {
    background: "color-mix(in srgb, var(--gold) 12%, transparent)",
    borderColor: "color-mix(in srgb, var(--gold) 35%, transparent)",
    color: "var(--gold-deep)",
  } as const;

  return (
    <section
      className="card overflow-hidden lg:sticky lg:top-6"
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
          <span className="chip !py-0.5 text-[11px] font-semibold" style={countChipStyle}>
            {t.zoneChat.liveCount(liveUsers.length)}
          </span>
        </div>

        {/* Serial 1: everyone live on the website. */}
        <div className="mt-4 flex items-center gap-2">
          <Users size={15} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          <h3 className="text-sm font-semibold">{t.zoneChat.siteLiveTitle}</h3>
          <span className="chip !py-0.5 text-[11px] font-semibold" style={countChipStyle}>
            {t.zoneChat.liveCount(liveUsers.length)}
          </span>
        </div>
        {liveUsers.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.zoneChat.liveEmpty}
          </p>
        ) : (
          <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
            {liveUsers.map((u) => (
              <LiveUserRow key={u.user_id} user={u} isYou={u.user_id === session.id} youLabel={t.zoneChat.you} />
            ))}
          </ul>
        )}

        <div className="my-4 border-t" style={{ borderColor: "var(--line)" }} aria-hidden="true" />

        {/* Serial 2: those inside the Gaming Zone right now. */}
        <div className="flex items-center gap-2">
          <Gamepad2 size={15} style={{ color: "var(--gold-deep)" }} aria-hidden="true" />
          <h3 className="text-sm font-semibold">{t.zoneChat.zoneLiveTitle}</h3>
          <span className="chip !py-0.5 text-[11px] font-semibold" style={countChipStyle}>
            {t.zoneChat.liveCount(inZone.length)}
          </span>
        </div>
        {inZone.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            {t.zoneChat.zoneEmpty}
          </p>
        ) : (
          <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto pr-1">
            {inZone.map((u) => (
              <LiveUserRow key={u.user_id} user={u} isYou={u.user_id === session.id} youLabel={t.zoneChat.you} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
