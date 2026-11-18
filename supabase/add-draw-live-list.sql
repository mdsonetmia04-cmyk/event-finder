-- Sweet Smart Calendar — Draw & Guess live list, migration v24
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- list_live_draw_rooms(): playing rooms updated within the last hour,
-- newest first, for the /games/live spectator list. The existing
-- list_draw_rooms() (v16) returns waiting rooms only, and direct
-- SELECT on draw_rooms is denied, so discovering running games needs
-- this dedicated read path.
--
-- SPECTATOR-SAFE FIELDS ONLY: id, code, updated_at + players
-- (user_id, name, avatar_url, score, seat) — exactly the fields
-- get_draw_room() already exposes to non-members. NO current_word, NO
-- used_words, NO word hint: the secret word can never leak through
-- this path. The approved-caller check matches the other Draw & Guess
-- RPCs. Function + grant only: it touches no table, no RLS policy,
-- and never touches storage.objects.

create or replace function public.list_live_draw_rooms()
returns table (id uuid, code text, updated_at timestamptz, players jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved') then
    return;
  end if;
  return query
    select r.id, r.code, r.updated_at,
      (select coalesce(jsonb_agg(jsonb_build_object(
          'user_id', dp.user_id,
          'name', dp.name,
          'avatar_url', dp.avatar_url,
          'score', dp.score,
          'seat', dp.seat
        ) order by dp.seat), '[]'::jsonb)
       from public.draw_players dp where dp.room_id = r.id)
    from public.draw_rooms r
    where r.status = 'playing'
      and r.updated_at > now() - interval '1 hour'
    order by r.updated_at desc
    limit 20;
end;
$$;

grant execute on function public.list_live_draw_rooms() to authenticated;
