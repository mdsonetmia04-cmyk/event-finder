-- Sweet Smart Calendar — Chess migration v23
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- 1) chess_rooms: one row per 2-player room. The creator takes the
--    White seat (seat 0) with a 6-character code (same alphabet as
--    Ludo/Draw & Guess codes, generated client-side); the code joiner
--    takes Black (seat 1) and the game starts immediately. status
--    moves waiting -> playing -> finished. fen holds the current
--    position; moves is the ordered move list (from/to/promotion/SAN)
--    so clients can render history and replay. result records how a
--    finished game ended (checkmate/stalemate/insufficient/threefold/
--    fifty/resign/draw_agreement) and winner_id the winner (null on
--    draws). draw_offer_by holds the user id of a pending draw offer.
--
-- 2) READS: chess has no hidden state (unlike Draw & Guess), so
--    spectators MUST be able to read the board. chess_rooms has RLS
--    enabled with a SELECT policy for all approved users — this also
--    lets every approved user receive realtime UPDATE events for the
--    room, which is how spectators watch the game live. There are NO
--    insert/update/delete policies: all mutations go through the
--    SECURITY DEFINER RPCs below, which lock the room row
--    (SELECT ... FOR UPDATE) so concurrent moves serialise safely.
--
-- 3) TRUST ASSUMPTION: move LEGALITY is enforced client-side by
--    chess.js. make_chess_move() validates that the caller is seated,
--    the game is playing, the caller's colour is to move (per the
--    turn field of the stored FEN), and that from/to/promotion/the
--    new FEN are well-formed with the turn flipped — it does NOT
--    re-validate the move against the rules. This is acceptable for
--    this friendly student site, where every client runs the same
--    chess.js library; a tampered client could only spoil its own
--    friendly game, never anyone's private data.
--
-- 4) chess_players: one row per seat, mirroring draw_players. RLS
--    enabled with ZERO policies; the only access path is the RPCs
--    (get_chess_room returns room + players as one JSON object).
--    Rooms persist after leaving (Draw & Guess re-entry model,
--    migration v19): leaving never deletes a room, the Black player
--    is promoted to White when White leaves a waiting room, an
--    emptied room keeps its code, and the next joiner becomes White.
--    Seated players re-enter playing/finished rooms by code; finished
--    rooms leave the open list but stay openable for the final board.
--
-- 5) chess_messages: per-room chat, mirroring draw_messages EXACTLY
--    (migration v21). The membership check MUST be SECURITY DEFINER
--    (is_chess_room_player): chess_players has RLS enabled with zero
--    policies, so a plain policy subquery would see zero rows and no
--    one could ever read or send. Only seated players can read or
--    send; spectators never render the chat and are denied by the
--    policies anyway. Messages are capped at 200 characters and can
--    never be edited or deleted.
--
-- 6) Realtime: chess_rooms (UPDATEs) and chess_messages (INSERTs)
--    are added to the supabase_realtime publication with the same
--    exception-tolerant pattern as migration v21.
--
-- 7) Presence: get_live_users() gains the 'chess' label for last_path
--    LIKE '/games/chess%', mirroring migrations v20/v22.
--
-- 8) Privacy: rooms, players and messages expose ONLY names, avatar
--    URLs and game state — never WhatsApp numbers, emails, or
--    earnings. No function reads any private profile field; the
--    approved-caller test checks status only.
--
-- This migration creates tables, indexes, functions, policies and
-- grants only — it never touches storage.objects.

-- 1) Game rooms.
create table if not exists public.chess_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  host_id uuid not null references public.profiles(id) on delete cascade,
  white_id uuid references public.profiles(id) on delete set null,
  black_id uuid references public.profiles(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves jsonb not null default '[]'::jsonb,
  result text check (result in ('checkmate', 'stalemate', 'insufficient', 'threefold', 'fifty', 'resign', 'draw_agreement')),
  winner_id uuid references public.profiles(id) on delete set null,
  draw_offer_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chess_rooms enable row level security;

create index if not exists chess_rooms_code_idx
  on public.chess_rooms (code);

create index if not exists chess_rooms_status_updated_at_idx
  on public.chess_rooms (status, updated_at desc);

-- Spectators (all approved users) may read the board; this also
-- authorises the realtime UPDATE stream every watcher subscribes to.
-- No insert/update/delete policies: mutations go through the RPCs.
drop policy if exists "chess rooms read" on public.chess_rooms;
create policy "chess rooms read"
  on public.chess_rooms for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  ));

grant select on public.chess_rooms to authenticated;

-- 2) Seats.
create table if not exists public.chess_players (
  room_id uuid not null references public.chess_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  seat integer not null check (seat in (0, 1)),
  primary key (room_id, user_id)
);

alter table public.chess_players enable row level security;

-- No policies on chess_players: RPC-gated, same as draw_players.

create index if not exists chess_players_room_seat_idx
  on public.chess_players (room_id, seat);

-- 3) The only read path for a room + seats. Returns the room and its
--    players as one JSON object. Safe for spectators: chess has no
--    hidden state.
create or replace function public.get_chess_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chess_rooms%rowtype;
  v_players jsonb;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved') then
    return null;
  end if;
  select * into v_room from public.chess_rooms where id = p_room_id;
  if not found then
    return null;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'user_id', cp.user_id,
      'name', cp.name,
      'avatar_url', cp.avatar_url,
      'seat', cp.seat
    ) order by cp.seat), '[]'::jsonb)
  into v_players
  from public.chess_players cp
  where cp.room_id = p_room_id;
  return jsonb_build_object(
    'id', v_room.id,
    'code', v_room.code,
    'host_id', v_room.host_id,
    'white_id', v_room.white_id,
    'black_id', v_room.black_id,
    'status', v_room.status,
    'fen', v_room.fen,
    'moves', v_room.moves,
    'result', v_room.result,
    'winner_id', v_room.winner_id,
    'draw_offer_by', v_room.draw_offer_by,
    'created_at', v_room.created_at,
    'updated_at', v_room.updated_at,
    'players', v_players
  );
end;
$$;

grant execute on function public.get_chess_room(uuid) to authenticated;

-- 4) Lobby listing: waiting + playing rooms updated within the last
--    hour, newest first — spectators watch playing rooms live.
--    Safe fields only: no position, no private profile data.
create or replace function public.list_chess_rooms()
returns table (id uuid, code text, host_name text, player_count bigint, status text, updated_at timestamptz)
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
      (select cp.name from public.chess_players cp where cp.room_id = r.id order by cp.seat limit 1),
      (select count(*) from public.chess_players cp where cp.room_id = r.id),
      r.status, r.updated_at
    from public.chess_rooms r
    where r.status in ('waiting', 'playing')
      and r.updated_at > now() - interval '1 hour'
    order by r.updated_at desc
    limit 20;
end;
$$;

grant execute on function public.list_chess_rooms() to authenticated;

-- 5) Code lookup for join-by-code: waiting, playing or finished
--    rooms. Seated players re-enter playing/finished rooms by code;
--    finished rooms stay openable for the final board. The caller
--    checks freshness (1 hour) itself.
create or replace function public.find_chess_room(p_code text)
returns table (id uuid, code text, status text, player_count bigint, updated_at timestamptz)
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
      (select count(*) from public.chess_players cp where cp.room_id = r.id),
      r.updated_at
    from public.chess_rooms r
    where r.code = upper(trim(p_code))
      and r.status in ('waiting', 'playing', 'finished')
    limit 1;
end;
$$;

grant execute on function public.find_chess_room(text) to authenticated;

-- 6) Create a room and seat the creator as White (seat 0). The code
--    must use the shared room-code alphabet (no I/L/O/0/1
--    look-alikes). Returns the room id, or null on any failure (a
--    code collision returns null so the client can retry with a
--    fresh code).
create or replace function public.create_chess_room(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(p_code));
  v_me public.profiles%rowtype;
  v_id uuid;
begin
  if v_code !~ '^[A-HJ-KM-NP-Z2-9]{6}$' then
    return null;
  end if;
  select * into v_me from public.profiles where id = auth.uid() and status = 'approved';
  if not found then
    return null;
  end if;
  insert into public.chess_rooms (code, host_id, white_id, status)
  values (v_code, auth.uid(), auth.uid(), 'waiting')
  returning id into v_id;
  insert into public.chess_players (room_id, user_id, name, avatar_url, seat)
  values (v_id, auth.uid(), v_me.name, v_me.avatar_url, 0);
  return v_id;
exception
  when unique_violation then
    return null;
end;
$$;

grant execute on function public.create_chess_room(text) to authenticated;

-- 7) Join a waiting room. Idempotent: a seated player gets true
--    again. The room row is locked so two joins racing for the last
--    seat cannot both land. The first joiner takes the free seat:
--    seat 0 (White, becoming host) when the room is empty or White
--    left, seat 1 (Black) otherwise — and the game starts the moment
--    both seats are filled.
create or replace function public.join_chess_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chess_rooms%rowtype;
  v_me public.profiles%rowtype;
  v_count integer;
  v_seat integer;
begin
  select * into v_me from public.profiles where id = auth.uid() and status = 'approved';
  if not found then
    return false;
  end if;
  select * into v_room from public.chess_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if exists (select 1 from public.chess_players where room_id = p_room_id and user_id = auth.uid()) then
    return true;
  end if;
  if v_room.status <> 'waiting' then
    return false;
  end if;
  if v_room.updated_at <= now() - interval '1 hour' then
    return false;
  end if;
  select count(*) into v_count from public.chess_players where room_id = p_room_id;
  if v_count >= 2 then
    return false;
  end if;
  if exists (select 1 from public.chess_players where room_id = p_room_id and seat = 0) then
    v_seat := 1;
  else
    v_seat := 0;
  end if;
  insert into public.chess_players (room_id, user_id, name, avatar_url, seat)
  values (p_room_id, auth.uid(), v_me.name, v_me.avatar_url, v_seat);
  update public.chess_rooms
  set white_id = case when v_seat = 0 then auth.uid() else white_id end,
      black_id = case when v_seat = 1 then auth.uid() else black_id end,
      host_id = case when v_seat = 0 then auth.uid() else host_id end,
      status = case when v_count + 1 >= 2 then 'playing' else 'waiting' end,
      updated_at = now()
  where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.join_chess_room(uuid) to authenticated;

-- 8) Leave a waiting room. The room is never deleted (re-entry
--    model): the leaver's seat is removed, Black is promoted to
--    White (seat 0 + host) when White leaves, and an emptied room
--    keeps its code for the next joiner. Mid-game leavers stay
--    seated and re-enter by code.
create or replace function public.leave_chess_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chess_rooms%rowtype;
  v_seat integer;
  v_other uuid;
begin
  select * into v_room from public.chess_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'waiting' then
    return false;
  end if;
  select seat into v_seat from public.chess_players
  where room_id = p_room_id and user_id = auth.uid();
  if not found then
    return false;
  end if;
  delete from public.chess_players where room_id = p_room_id and user_id = auth.uid();
  if v_seat = 0 then
    select user_id into v_other from public.chess_players
    where room_id = p_room_id and seat = 1;
    if v_other is not null then
      update public.chess_players set seat = 0
      where room_id = p_room_id and user_id = v_other;
      update public.chess_rooms
      set white_id = v_other, black_id = null, host_id = v_other, updated_at = now()
      where id = p_room_id;
    else
      update public.chess_rooms set white_id = null, updated_at = now()
      where id = p_room_id;
    end if;
  else
    update public.chess_rooms set black_id = null, updated_at = now()
    where id = p_room_id;
  end if;
  return true;
end;
$$;

grant execute on function public.leave_chess_room(uuid) to authenticated;

-- 9) Apply a move. Validates: caller seated, game playing, caller's
--    colour to move (turn field of the stored FEN), well-formed
--    from/to/promotion/SAN, and a new FEN whose turn field flipped.
--    Move LEGALITY is enforced client-side by chess.js (see the
--    trust assumption in the header). Appends the move, stores the
--    client-computed FEN, clears any draw offer, and finishes the
--    game when the caller reports a result — a checkmate's winner
--    must be the caller.
create or replace function public.make_chess_move(
  p_room_id uuid,
  p_from text,
  p_to text,
  p_promotion text,
  p_fen text,
  p_san text,
  p_result text,
  p_winner_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chess_rooms%rowtype;
  v_seat integer;
  v_turn text;
begin
  if p_from !~ '^[a-h][1-8]$' or p_to !~ '^[a-h][1-8]$' then
    return false;
  end if;
  if p_promotion is not null and p_promotion !~ '^[qrbn]$' then
    return false;
  end if;
  if p_san is null or char_length(p_san) < 2 or char_length(p_san) > 10 then
    return false;
  end if;
  if p_fen is null or char_length(p_fen) > 120 then
    return false;
  end if;
  if p_result is not null
    and p_result not in ('checkmate', 'stalemate', 'insufficient', 'threefold', 'fifty') then
    return false;
  end if;
  if p_result = 'checkmate' and p_winner_id is distinct from auth.uid() then
    return false;
  end if;
  if p_result is distinct from 'checkmate' and p_winner_id is not null then
    return false;
  end if;
  select * into v_room from public.chess_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' then
    return false;
  end if;
  select seat into v_seat from public.chess_players
  where room_id = p_room_id and user_id = auth.uid();
  if not found then
    return false;
  end if;
  v_turn := split_part(v_room.fen, ' ', 2);
  if (v_seat = 0 and v_turn <> 'w') or (v_seat = 1 and v_turn <> 'b') then
    return false;
  end if;
  if split_part(p_fen, ' ', 2) = v_turn or p_fen = v_room.fen then
    return false;
  end if;
  update public.chess_rooms
  set fen = p_fen,
      moves = moves || jsonb_build_object(
        'from', p_from,
        'to', p_to,
        'promotion', p_promotion,
        'san', p_san
      ),
      draw_offer_by = null,
      status = case when p_result is not null then 'finished' else 'playing' end,
      result = p_result,
      winner_id = p_winner_id,
      updated_at = now()
  where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.make_chess_move(uuid, text, text, text, text, text, text, uuid) to authenticated;

-- 10) Resign: the opponent wins. Seated players only, playing games
--     only.
create or replace function public.resign_chess_game(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chess_rooms%rowtype;
  v_other uuid;
begin
  select * into v_room from public.chess_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' then
    return false;
  end if;
  if not exists (select 1 from public.chess_players where room_id = p_room_id and user_id = auth.uid()) then
    return false;
  end if;
  select user_id into v_other from public.chess_players
  where room_id = p_room_id and user_id <> auth.uid();
  update public.chess_rooms
  set status = 'finished', result = 'resign', winner_id = v_other,
      draw_offer_by = null, updated_at = now()
  where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.resign_chess_game(uuid) to authenticated;

-- 11) Offer a draw: one pending offer at a time. A move clears the
--     offer (see make_chess_move).
create or replace function public.offer_chess_draw(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chess_rooms%rowtype;
begin
  select * into v_room from public.chess_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' or v_room.draw_offer_by is not null then
    return false;
  end if;
  if not exists (select 1 from public.chess_players where room_id = p_room_id and user_id = auth.uid()) then
    return false;
  end if;
  update public.chess_rooms set draw_offer_by = auth.uid(), updated_at = now()
  where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.offer_chess_draw(uuid) to authenticated;

-- 12) Answer a draw offer: only the opponent (never the offerer).
--     Accept ends the game as an agreed draw; decline clears the
--     offer and play continues.
create or replace function public.answer_chess_draw(p_room_id uuid, p_accept boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chess_rooms%rowtype;
begin
  select * into v_room from public.chess_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' then
    return false;
  end if;
  if v_room.draw_offer_by is null or v_room.draw_offer_by = auth.uid() then
    return false;
  end if;
  if not exists (select 1 from public.chess_players where room_id = p_room_id and user_id = auth.uid()) then
    return false;
  end if;
  if p_accept then
    update public.chess_rooms
    set status = 'finished', result = 'draw_agreement', winner_id = null,
        draw_offer_by = null, updated_at = now()
    where id = p_room_id;
  else
    update public.chess_rooms set draw_offer_by = null, updated_at = now()
    where id = p_room_id;
  end if;
  return true;
end;
$$;

grant execute on function public.answer_chess_draw(uuid, boolean) to authenticated;

-- 13) Play again: any seated player may restart a finished room
--     immediately (no waiting phase — both seats are filled).
--     Colours swap so the loser of the colour draw gets White.
create or replace function public.play_again_chess(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.chess_rooms%rowtype;
begin
  select * into v_room from public.chess_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'finished' then
    return false;
  end if;
  if not exists (select 1 from public.chess_players where room_id = p_room_id and user_id = auth.uid()) then
    return false;
  end if;
  update public.chess_players set seat = 1 - seat where room_id = p_room_id;
  update public.chess_rooms
  set status = 'playing',
      fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves = '[]'::jsonb,
      result = null,
      winner_id = null,
      draw_offer_by = null,
      white_id = black_id,
      black_id = white_id,
      host_id = black_id,
      updated_at = now()
  where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.play_again_chess(uuid) to authenticated;

-- 14) Room chat, mirroring draw_messages exactly (migration v21).
create table if not exists public.chess_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.chess_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 200),
  created_at timestamptz not null default now()
);

alter table public.chess_messages enable row level security;

create index if not exists chess_messages_room_created_idx
  on public.chess_messages (room_id, created_at);

-- Membership helper. The policies below are dropped first so the
-- function can be dropped and recreated on re-runs (a function with
-- dependent policies cannot be dropped).
drop policy if exists "chess messages read" on public.chess_messages;
drop policy if exists "chess messages send" on public.chess_messages;
drop function if exists public.is_chess_room_player(uuid);
create function public.is_chess_room_player(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.chess_players
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

comment on function public.is_chess_room_player(uuid) is
  'True when the caller holds a seat in the given Chess room. SECURITY DEFINER because chess_players has RLS enabled with no policies, so a policy-time subquery would see no rows.';

drop policy if exists "chess messages read" on public.chess_messages;
create policy "chess messages read"
  on public.chess_messages for select
  using (public.is_chess_room_player(room_id));

drop policy if exists "chess messages send" on public.chess_messages;
create policy "chess messages send"
  on public.chess_messages for insert
  with check (
    user_id = auth.uid()
    and public.is_chess_room_player(room_id)
  );

-- No update/delete policies on chess_messages: denied by default under RLS.

grant select, insert on public.chess_messages to authenticated;
grant execute on function public.is_chess_room_player(uuid) to authenticated;

-- 15) Realtime publication: room UPDATEs (live board for players and
--     spectators) and message INSERTs (room chat).
do $$
begin
  execute 'alter publication supabase_realtime add table public.chess_rooms';
exception when duplicate_object then
  null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.chess_messages';
exception when duplicate_object then
  null;
end $$;

-- 16) Presence: the live card's game pill now also covers Chess
--     pages (/games/chess, /games/chess/solo, /games/chess/room/*).
--     get_live_users() is dropped and recreated (return type is
--     unchanged, but the drop/recreate pattern keeps the migration
--     uniform and idempotent); the grant is re-applied. Everything
--     else is unchanged from migration v22.
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
        when p.last_path like '/games/chess%' then 'chess'
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

-- No table grants on chess_players: with RLS enabled and no policies,
-- direct table access is denied for every role; the RPCs above are
-- the only access path.
