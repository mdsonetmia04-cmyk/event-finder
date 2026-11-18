-- Sweet Smart Calendar — Gaming Zone game-presence migration v22
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Extends migration v20's current_game label to Bubble Shooter: the live
-- card's game pill now also covers players on /games/bubble-shooter pages.
--
--   current_game = 'ludo'          when last_path starts with /games/ludo
--                = 'quiz-battle'   when last_path starts with /games/quiz-battle
--                = 'draw-guess'    when last_path starts with /games/draw-guess
--                = 'arrows-out'    when last_path starts with /games/arrows-out
--                = 'bubble-shooter' when last_path starts with /games/bubble-shooter
--                = NULL            otherwise
--
-- get_live_users() is dropped and recreated (return type is unchanged
-- this time, but the drop/recreate pattern keeps the migration uniform
-- and idempotent); the grant is re-applied. Everything else is
-- unchanged: approved + non-demo + 3-minute window, id + name + avatar
-- + last_seen + in_zone, ordering and limit — never phone numbers,
-- emails or earnings. No RLS change, no new column.
--
-- This migration recreates one function and its grant only — it never
-- touches storage.objects. Requires migration v14 (profiles.last_path)
-- to be applied first.

-- Live-users read, now with the Bubble Shooter game label.
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
        when p.last_path like '/games/draw-guess%' then 'draw-guess'
        when p.last_path like '/games/arrows-out%' then 'arrows-out'
        when p.last_path like '/games/bubble-shooter%' then 'bubble-shooter'
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
