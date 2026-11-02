-- Sweet Smart Calendar — presence tracking migration v4
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Tracks per-user activity: last_seen (most recent heartbeat), first_seen
-- (first time the user opened the site while logged in) and total_seconds
-- (cumulative active time, built from heartbeats). The app sends a heartbeat
-- every 60 seconds while logged in; each beat adds at most 120 seconds so a
-- stale beat can never inflate the total.

alter table public.profiles
  add column if not exists last_seen timestamptz,
  add column if not exists first_seen timestamptz,
  add column if not exists total_seconds integer not null default 0;

-- One RPC for the client heartbeat. SECURITY DEFINER runs as the table
-- owner, so no RLS policy change is needed and a user can only ever touch
-- their own row (auth.uid()).
create or replace function public.heartbeat()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set total_seconds = total_seconds + case
        when last_seen is null then 0
        else least(greatest(extract(epoch from (now() - last_seen))::integer, 0), 120)
      end,
      first_seen = coalesce(first_seen, now()),
      last_seen = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.heartbeat() to authenticated;
