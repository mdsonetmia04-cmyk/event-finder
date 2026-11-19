-- Sweet Smart Calendar — leaderboard heartbeat fix migration v26
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- ROOT CAUSE (found 2026-11-19): migration v10
-- (supabase/add-avatars-daily-leaderboard.sql) defined heartbeat() with no
-- arguments, and it upserted the daily (profile_daily_seconds) and monthly
-- (profile_monthly_seconds) rollups alongside profiles.total_seconds.
-- Migration v14 (supabase/add-zone-presence.sql) DROPPED heartbeat() and
-- recreated it as heartbeat(p_path text default null) so the Gaming Zone
-- could store the current path — but the new version only updates
-- total_seconds / last_seen / last_path and DROPPED the daily + monthly
-- upserts. Live evidence: profile_daily_seconds has no 2026-11-19 rows,
-- its latest_update is stuck on 2026-11-17, while profiles.last_seen is
-- fresh and All-time (total_seconds) still grows. Result: the Today tab
-- is empty and the Last 7 days / This month boards are stale since
-- ~2026-11-18 01:08 Dhaka.
--
-- This migration restores the v10 rollups into the v14 signature. The
-- signature is unchanged (p_path text default null), so CREATE OR REPLACE
-- works — no DROP needed, and existing no-arg and p_path callers both
-- keep working. The delta logic is identical to v10: 0 when last_seen is
-- null, else seconds since last_seen capped at 120. The rollups only
-- run when delta > 0 and the profile exists.
--
-- NOTE: the daily splits for 2026-11-18/19 are unrecoverable (the
-- heartbeat kept accumulating total_seconds only, with no per-day
-- record) — this migration does NOT attempt a backfill. From the moment
-- it runs, daily / monthly accumulation resumes and the boards catch up
-- going forward.
--
-- This migration changes a function only — no tables, no RLS changes.

create or replace function public.heartbeat(p_path text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  delta integer := 0;
  m text;
  d text;
begin
  select case
      when last_seen is null then 0
      else least(greatest(extract(epoch from (now() - last_seen))::integer, 0), 120)
    end
    into delta
    from public.profiles
    where id = auth.uid();

  delta := coalesce(delta, 0);

  update public.profiles
  set total_seconds = total_seconds + delta,
      first_seen = coalesce(first_seen, now()),
      last_seen = now(),
      last_path = coalesce(left(p_path, 200), last_path)
  where id = auth.uid();

  -- Daily + monthly rollups (restored from v10): only when a profile
  -- row exists and time passed.
  if delta > 0 and exists (select 1 from public.profiles where id = auth.uid()) then
    m := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM');
    d := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM-DD');
    insert into public.profile_monthly_seconds (user_id, month, seconds)
    values (auth.uid(), m, delta)
    on conflict (user_id, month)
    do update set seconds = profile_monthly_seconds.seconds + excluded.seconds,
                  updated_at = now();
    insert into public.profile_daily_seconds (user_id, day, seconds)
    values (auth.uid(), d, delta)
    on conflict (user_id, day)
    do update set seconds = profile_daily_seconds.seconds + excluded.seconds,
                  updated_at = now();
  end if;
end;
$$;

grant execute on function public.heartbeat(text) to authenticated;
