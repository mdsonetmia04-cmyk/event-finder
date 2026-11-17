-- Sweet Smart Calendar — Draw & Guess room re-entry migration v19
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- OWNER RULE: leaving a room must never destroy it. Anyone who leaves
-- a room — including the host who created it — must be able to
-- re-enter it with the code, and anyone else must be able to enter a
-- room someone created. Migration v16's leave_draw_room deleted the
-- whole room when the host left a waiting room, so nobody could ever
-- come back; this migration replaces that behaviour:
--
-- 1) leave_draw_room: waiting rooms only (unchanged gate). Removes
--    ONLY the caller's seat row; the room itself is NEVER deleted. If
--    the leaver was host and others remain, hosthood transfers to the
--    lowest-seat remaining player. If nobody remains, the room stays
--    with 0 players — the next joiner becomes host (see join). A
--    caller who is not seated gets true as a no-op. The FOR UPDATE
--    lock and the waiting-only gate are unchanged: mid-game leavers
--    stay seated, as before.
--
-- 2) join_draw_room: every existing check is unchanged (approved,
--    waiting, fresh, free seat, idempotent re-join, max+1 seat). ADD:
--    when the room has 0 seated players at join time, the joiner
--    becomes host (host_id = auth.uid(); the seat is 0 via the max+1
--    rule), so a creator who left an emptied room resumes as host on
--    re-entry.
--
-- 3) list_draw_rooms: unchanged except host_name now falls back to the
--    host profile's name when no player row exists, so emptied rooms
--    still render sensibly in the lobby. Only the name field is read.
--
-- 4) find_draw_room: the status filter now includes 'finished' as well
--    as 'waiting'/'playing', so seated players can look a finished
--    room up by code to return for Play Again. Callers that must only
--    offer joining (Game Chat chips) filter on status themselves.
--
-- No new tables, no RLS changes, no new grants: all four functions
-- already exist with execute grants to authenticated, and CREATE OR
-- REPLACE keeps them. This migration recreates four functions only —
-- it never touches storage.objects. Requires migration v16.

-- 1) Leave a waiting room: remove only the caller's seat, never the
--    room. Hosthood transfers to the lowest-seat remaining player;
--    an emptied room waits for its next joiner to become host.
create or replace function public.leave_draw_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
  v_next_host uuid;
begin
  select * into v_room from public.draw_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'waiting' then
    return false;
  end if;
  if not exists (select 1 from public.draw_players where room_id = p_room_id and user_id = auth.uid()) then
    return true;
  end if;
  delete from public.draw_players where room_id = p_room_id and user_id = auth.uid();
  if v_room.host_id = auth.uid() then
    select user_id into v_next_host from public.draw_players
    where room_id = p_room_id order by seat limit 1;
    if v_next_host is not null then
      update public.draw_rooms set host_id = v_next_host, updated_at = now() where id = p_room_id;
    else
      update public.draw_rooms set updated_at = now() where id = p_room_id;
    end if;
  else
    update public.draw_rooms set updated_at = now() where id = p_room_id;
  end if;
  return true;
end;
$$;

grant execute on function public.leave_draw_room(uuid) to authenticated;

-- 2) Join a waiting room. Idempotent: a seated player gets true again.
--    The room row is locked so two joins racing for the last seat
--    cannot both land. The first joiner into an emptied room becomes
--    host.
create or replace function public.join_draw_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
  v_me public.profiles%rowtype;
  v_count integer;
  v_seat integer;
begin
  select * into v_me from public.profiles where id = auth.uid() and status = 'approved';
  if not found then
    return false;
  end if;
  select * into v_room from public.draw_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if exists (select 1 from public.draw_players where room_id = p_room_id and user_id = auth.uid()) then
    return true;
  end if;
  if v_room.status <> 'waiting' then
    return false;
  end if;
  if v_room.updated_at <= now() - interval '1 hour' then
    return false;
  end if;
  select count(*) into v_count from public.draw_players where room_id = p_room_id;
  if v_count >= v_room.max_players then
    return false;
  end if;
  -- Seat numbers must stay unique: a rejoiner after a leave would reuse
  -- a seat if we used the count, and drawer rotation could skip a seat.
  select coalesce(max(seat), -1) + 1 into v_seat from public.draw_players where room_id = p_room_id;
  insert into public.draw_players (room_id, user_id, name, avatar_url, seat)
  values (p_room_id, auth.uid(), v_me.name, v_me.avatar_url, v_seat);
  if v_count = 0 then
    update public.draw_rooms set host_id = auth.uid(), updated_at = now() where id = p_room_id;
  else
    update public.draw_rooms set updated_at = now() where id = p_room_id;
  end if;
  return true;
end;
$$;

grant execute on function public.join_draw_room(uuid) to authenticated;

-- 3) Lobby listing: waiting rooms updated within the last hour, newest
--    first. Safe fields only — no word, no player identities beyond the
--    host's display name (seat-0 player, or the host profile when the
--    room is empty).
create or replace function public.list_draw_rooms()
returns table (id uuid, code text, host_name text, player_count bigint, max_players integer, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved') then
    return;
  end if;
  return query
    select r.id, r.code,
      coalesce(
        (select dp.name from public.draw_players dp where dp.room_id = r.id order by dp.seat limit 1),
        (select p.name from public.profiles p where p.id = r.host_id)
      ),
      (select count(*) from public.draw_players dp where dp.room_id = r.id),
      r.max_players, r.updated_at
    from public.draw_rooms r
    where r.status = 'waiting'
      and r.updated_at > now() - interval '1 hour'
    order by r.updated_at desc
    limit 20;
end;
$$;

grant execute on function public.list_draw_rooms() to authenticated;

-- 4) Code lookup for join-by-code and Game Chat chips: waiting,
--    playing or finished rooms. The caller checks freshness (1 hour)
--    and, for chips, joinable status itself, like the Ludo chip
--    resolver does.
create or replace function public.find_draw_room(p_code text)
returns table (id uuid, code text, status text, player_count bigint, max_players integer, updated_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved') then
    return;
  end if;
  return query
    select r.id, r.code, r.status,
      (select count(*) from public.draw_players dp where dp.room_id = r.id),
      r.max_players, r.updated_at
    from public.draw_rooms r
    where r.code = upper(trim(p_code))
      and r.status in ('waiting', 'playing', 'finished')
    limit 1;
end;
$$;

grant execute on function public.find_draw_room(text) to authenticated;
