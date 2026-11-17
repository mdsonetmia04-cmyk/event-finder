-- Sweet Smart Calendar — Gaming Zone game-presence migration v15
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- The Gaming Zone's tall live card shows, next to each live user's name,
-- the name of the game they are currently playing — so others can tell
-- at a glance who is in a Ludo game and who is in a Quiz Battle. The
-- game is derived from the path stored by migration v14
-- (profiles.last_path, stamped by heartbeat(p_path)):
--
--   current_game = 'ludo'        when last_path starts with /games/ludo
--                = 'quiz-battle' when last_path starts with /games/quiz-battle
--                = NULL          otherwise (browsing the zone, another
--                                  page, or an unknown path)
--
-- get_live_users() gains a current_game text column in its return shape.
-- Postgres cannot change a function's return type with CREATE OR
-- REPLACE, so the function is dropped first and the grant is re-applied.
-- Everything else is unchanged: approved + non-demo + 3-minute window,
-- id + name + avatar + last_seen + in_zone, ordering and limit — never
-- phone numbers, emails or earnings. No RLS change, no new column.
--
-- This migration recreates one function and its grant only — it never
-- touches storage.objects. Clients built for v15 degrade gracefully if
-- it has not run yet: rows without the column are treated as "no game"
-- and the name pill simply stays hidden until v15 is applied.
-- Requires migration v14 (profiles.last_path) to be applied first.

-- Live-users read, now with the current-game label.
drop function if exists public.get_live_users();

create or replace function public.get_live_users()
returns table (user_id uuid, display_name text, avatar_url text, last_seen timestamptz, in_zone boolean, current_game text)
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
      coalesce(p.last_path = '/games' or p.last_path like '/games/%', false),
      case
        when p.last_path like '/games/ludo%' then 'ludo'
        when p.last_path like '/games/quiz-battle%' then 'quiz-battle'
        else null
      end
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
