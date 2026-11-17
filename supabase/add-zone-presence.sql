-- Sweet Smart Calendar — Gaming Zone presence migration v14
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- The Gaming Zone's tall live card shows TWO lists: everyone live on the
-- website, and the subset currently inside the Gaming Zone (their last
-- heartbeat came from a page under /games). This needs the client's
-- current path stored alongside last_seen:
--
-- 1) profiles.last_path: the pathname of the page the user was on at
--    their most recent heartbeat (nullable, default null — null means
--    "unknown", treated as NOT in the zone).
--
-- 2) heartbeat(p_path text default null): the v4 heartbeat() gains an
--    OPTIONAL path argument, so existing no-arg calls keep working.
--    Postgres cannot change a function's argument list with CREATE OR
--    REPLACE, so the old function is dropped first and the grant is
--    re-applied. A null path leaves the stored path untouched, so stale
--    clients calling heartbeat() with no argument never wipe it.
--
-- 3) get_live_users(): gains an in_zone boolean in its return shape
--    (true when last_path is '/games' or starts with '/games/'; null
--    path = false). Same CREATE OR REPLACE limitation applies to the
--    return type, so it is dropped and recreated with its grant.
--    Everything else is unchanged: approved + non-demo + 3-minute
--    window, id + name + avatar + last_seen only — never phone numbers,
--    emails or earnings. No RLS change.
--
-- This migration creates a column, functions and grants only — it never
-- touches storage.objects. Clients built for v14 degrade gracefully if
-- it has not run yet: the heartbeat falls back to the no-arg call, and
-- the zone list simply stays empty until v14 is applied.

-- 1) Current page path on each profile.
alter table public.profiles
  add column if not exists last_path text;

-- 2) Heartbeat with an optional path argument.
drop function if exists public.heartbeat();

create or replace function public.heartbeat(p_path text default null)
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
      last_seen = now(),
      last_path = coalesce(left(p_path, 200), last_path)
  where id = auth.uid();
end;
$$;

grant execute on function public.heartbeat(text) to authenticated;

-- 3) Live-users read, now with the in-zone flag.
drop function if exists public.get_live_users();

create or replace function public.get_live_users()
returns table (user_id uuid, display_name text, avatar_url text, last_seen timestamptz, in_zone boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  ) then
    return;
  end if;

  return query
    select p.id, p.name, p.avatar_url, p.last_seen,
      coalesce(p.last_path = '/games' or p.last_path like '/games/%', false)
    from public.profiles p
    where p.status = 'approved'
      and p.whatsapp not in ('01900000000', '01900000001')
      and p.last_seen is not null
      and p.last_seen > now() - interval '3 minutes'
    order by p.name asc
    limit 100;
end;
$$;

grant execute on function public.get_live_users() to authenticated;
