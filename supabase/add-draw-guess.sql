-- Sweet Smart Calendar — Draw & Guess migration v16
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- 1) draw_rooms: one row per game room. The host creates a room with a
--    6-character code (same alphabet as Ludo codes, generated
--    client-side); players join from the open lobby (waiting rooms) or
--    by entering the code. status moves waiting -> playing -> finished.
--    phase tracks the round state: 'picking' (drawer chooses 1 of 3
--    words), 'drawing' (60s), 'reveal' (6s). round_ends_at is the
--    deadline of the CURRENT phase (pick 30s, draw 60s, reveal 6s) —
--    any member's client calls advance_draw_round() when it expires.
--    used_words holds every word already drawn in this game so no word
--    repeats; it is wiped on Play Again.
--
-- 2) THE HIDDEN WORD: current_word must never reach guessers. There is
--    NO select policy on draw_rooms (and no policy at all on either
--    table): with RLS enabled and no policy, every direct row access is
--    denied. The ONLY read path is get_draw_room(), a SECURITY DEFINER
--    RPC that returns current_word ONLY to the current drawer — or to
--    everyone during the reveal phase, when the word is shown openly.
--    Guesses are validated server-side by check_draw_guess(), which
--    compares case-insensitively and returns only hit/miss. The word
--    hint (letters masked, spaces kept) is safe to show everyone.
--
-- 3) draw_players: one row per seat. Each row snapshots the player's
--    name and avatar_url (same as ludo rooms) so the scoreboard still
--    reads correctly if a profile changes later. score accumulates
--    across rounds; has_guessed resets every round. seat is the drawing
--    order (0 = host, draws first).
--
-- 4) All writes go through SECURITY DEFINER RPCs that lock the room row
--    (SELECT ... FOR UPDATE), so concurrent joins, guesses and
--    round-advances serialise safely. Every RPC checks the caller is
--    approved; mutating RPCs check membership/role as well. Lobby
--    listing and code lookup are RPCs too (list_draw_rooms,
--    find_draw_room) returning only safe fields — no word, no private
--    profile data. Rooms stop being joinable/listable 1 hour after
--    their last update (same freshness rule as Ludo).
--
-- 5) Privacy: rooms and players expose ONLY names, avatar URLs, scores
--    and game state — never WhatsApp numbers, emails, or earnings. No
--    function reads any private profile field; the approved-caller test
--    checks status only.
--
-- 6) Strokes are NOT stored: the drawer streams them over a Supabase
--    Realtime broadcast channel (draw:<room id>), so no stroke table
--    and no publication change is needed. This migration creates
--    tables, indexes, functions and grants only — it never touches
--    storage.objects.

-- 1) Game rooms.
create table if not exists public.draw_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  host_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  max_players integer not null check (max_players between 2 and 6),
  phase text check (phase in ('picking', 'drawing', 'reveal')),
  current_drawer_id uuid references public.profiles(id) on delete set null,
  current_word text,
  used_words jsonb not null default '[]'::jsonb,
  round_no integer not null default 0,
  max_rounds integer not null default 0,
  round_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.draw_rooms enable row level security;

create index if not exists draw_rooms_code_idx
  on public.draw_rooms (code);

create index if not exists draw_rooms_status_updated_at_idx
  on public.draw_rooms (status, updated_at desc);

-- No policies on draw_rooms: RLS enabled + no policy = every direct
-- access denied. Reads and writes go through the RPCs below.

-- 2) Seats.
create table if not exists public.draw_players (
  room_id uuid not null references public.draw_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  score integer not null default 0,
  has_guessed boolean not null default false,
  seat integer not null,
  primary key (room_id, user_id)
);

alter table public.draw_players enable row level security;

-- No policies on draw_players either: RPC-gated, same as draw_rooms.

create index if not exists draw_players_room_seat_idx
  on public.draw_players (room_id, seat);

-- 3) The only read path for a room. Returns the room + players as one
--    JSON object. current_word is included ONLY for the current drawer,
--    or for everyone while phase = 'reveal'. used_words is drawer-only
--    (it contains the secret word from the moment it is picked).
--    word_hint masks every letter with "_" but keeps spaces, so
--    guessers see the word's shape without seeing the word.
create or replace function public.get_draw_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
  v_players jsonb;
  v_is_drawer boolean;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved') then
    return null;
  end if;
  select * into v_room from public.draw_rooms where id = p_room_id;
  if not found then
    return null;
  end if;
  v_is_drawer := (auth.uid() = v_room.current_drawer_id);
  select coalesce(jsonb_agg(jsonb_build_object(
      'user_id', dp.user_id,
      'name', dp.name,
      'avatar_url', dp.avatar_url,
      'score', dp.score,
      'has_guessed', dp.has_guessed,
      'seat', dp.seat
    ) order by dp.seat), '[]'::jsonb)
  into v_players
  from public.draw_players dp
  where dp.room_id = p_room_id;
  return jsonb_build_object(
    'id', v_room.id,
    'code', v_room.code,
    'host_id', v_room.host_id,
    'status', v_room.status,
    'max_players', v_room.max_players,
    'phase', v_room.phase,
    'current_drawer_id', v_room.current_drawer_id,
    'current_word', case when v_is_drawer or v_room.phase = 'reveal' then v_room.current_word else null end,
    'word_hint', case
      when v_room.phase in ('drawing', 'reveal') and v_room.current_word is not null
        then regexp_replace(v_room.current_word, '[a-z]', '_', 'g')
      else null end,
    'used_words', case when v_is_drawer then v_room.used_words else '[]'::jsonb end,
    'round_no', v_room.round_no,
    'max_rounds', v_room.max_rounds,
    'round_ends_at', v_room.round_ends_at,
    'created_at', v_room.created_at,
    'updated_at', v_room.updated_at,
    'players', v_players
  );
end;
$$;

grant execute on function public.get_draw_room(uuid) to authenticated;

-- 4) Lobby listing: waiting rooms updated within the last hour, newest
--    first. Safe fields only — no word, no player identities beyond the
--    host's display name.
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
      (select dp.name from public.draw_players dp where dp.room_id = r.id order by dp.seat limit 1),
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

-- 5) Code lookup for join-by-code and Game Chat chips: waiting or
--    playing rooms only. The caller checks freshness (1 hour) itself,
--    like the Ludo chip resolver does.
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
      and r.status in ('waiting', 'playing')
    limit 1;
end;
$$;

grant execute on function public.find_draw_room(text) to authenticated;

-- 6) Create a room and seat the host (seat 0). The code must use the
--    shared room-code alphabet (no I/L/O/0/1 look-alikes). Returns the
--    room id, or null on any failure (a code collision returns null so
--    the client can retry with a fresh code).
create or replace function public.create_draw_room(p_code text, p_max_players integer)
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
  if p_max_players < 2 or p_max_players > 6 then
    return null;
  end if;
  if v_code !~ '^[A-HJ-KM-NP-Z2-9]{6}$' then
    return null;
  end if;
  select * into v_me from public.profiles where id = auth.uid() and status = 'approved';
  if not found then
    return null;
  end if;
  insert into public.draw_rooms (code, host_id, status, max_players)
  values (v_code, auth.uid(), 'waiting', p_max_players)
  returning id into v_id;
  insert into public.draw_players (room_id, user_id, name, avatar_url, seat)
  values (v_id, auth.uid(), v_me.name, v_me.avatar_url, 0);
  return v_id;
exception
  when unique_violation then
    return null;
end;
$$;

grant execute on function public.create_draw_room(text, integer) to authenticated;

-- 7) Join a waiting room. Idempotent: a seated player gets true again.
--    The room row is locked so two joins racing for the last seat
--    cannot both land.
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
  update public.draw_rooms set updated_at = now() where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.join_draw_room(uuid) to authenticated;

-- 8) Leave a waiting room: the host deletes the whole room; anyone else
--    removes only themselves. Mid-game leavers stay seated (their turns
--    are skipped by the pick timeout), like Ludo's auto-play rule.
create or replace function public.leave_draw_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
begin
  select * into v_room from public.draw_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'waiting' then
    return false;
  end if;
  if v_room.host_id = auth.uid() then
    delete from public.draw_rooms where id = p_room_id;
  else
    delete from public.draw_players where room_id = p_room_id and user_id = auth.uid();
    update public.draw_rooms set updated_at = now() where id = p_room_id;
  end if;
  return true;
end;
$$;

grant execute on function public.leave_draw_room(uuid) to authenticated;

-- 9) Start the game: host-only, waiting room, 2+ seated players. Every
--    seated player draws once, so max_rounds = player count; seat 0
--    (the host) draws first. The drawer gets 30 seconds to pick a word.
create or replace function public.start_draw_game(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
  v_count integer;
  v_first uuid;
begin
  select * into v_room from public.draw_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.host_id <> auth.uid() then
    return false;
  end if;
  if v_room.status <> 'waiting' then
    return false;
  end if;
  select count(*) into v_count from public.draw_players where room_id = p_room_id;
  if v_count < 2 then
    return false;
  end if;
  select user_id into v_first from public.draw_players
  where room_id = p_room_id order by seat limit 1;
  update public.draw_rooms
  set status = 'playing', phase = 'picking', round_no = 1, max_rounds = v_count,
      current_drawer_id = v_first, current_word = null, used_words = '[]'::jsonb,
      round_ends_at = now() + interval '30 seconds', updated_at = now()
  where id = p_room_id;
  update public.draw_players set score = 0, has_guessed = false where room_id = p_room_id;
  return true;
end;
$$;

grant execute on function public.start_draw_game(uuid) to authenticated;

-- 10) The drawer picks a word: drawer-only, picking phase only, and the
--     word must not have been used already in this game. Starts the
--     60-second drawing clock and resets everyone's guessed flag.
create or replace function public.start_draw_round(p_room_id uuid, p_word text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
  v_word text := lower(regexp_replace(trim(p_word), '\s+', ' ', 'g'));
begin
  if v_word = '' or char_length(v_word) > 40 then
    return false;
  end if;
  select * into v_room from public.draw_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' or v_room.phase <> 'picking' then
    return false;
  end if;
  if v_room.current_drawer_id <> auth.uid() then
    return false;
  end if;
  if v_room.used_words ? v_word then
    return false;
  end if;
  update public.draw_rooms
  set current_word = v_word, phase = 'drawing',
      round_ends_at = now() + interval '60 seconds',
      used_words = used_words || to_jsonb(v_word), updated_at = now()
  where id = p_room_id;
  update public.draw_players set has_guessed = false where room_id = p_room_id;
  return true;
end;
$$;

grant execute on function public.start_draw_round(uuid, text) to authenticated;

-- 11) Validate a guess server-side: the word never leaves the server.
--     A correct guess scores +100 for the guesser and +50 for the
--     drawer. When every non-drawer has guessed, the round moves to
--     reveal. Returns true only on a fresh correct guess.
create or replace function public.check_draw_guess(p_room_id uuid, p_guess text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
  v_guess text := lower(regexp_replace(trim(p_guess), '\s+', ' ', 'g'));
  v_remaining integer;
begin
  if v_guess = '' or char_length(v_guess) > 40 then
    return false;
  end if;
  select * into v_room from public.draw_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' or v_room.phase <> 'drawing' then
    return false;
  end if;
  if v_room.current_drawer_id = auth.uid() then
    return false;
  end if;
  if v_room.round_ends_at is not null and v_room.round_ends_at <= now() then
    return false;
  end if;
  if not exists (
    select 1 from public.draw_players
    where room_id = p_room_id and user_id = auth.uid() and has_guessed = false
  ) then
    return false;
  end if;
  if v_guess <> lower(v_room.current_word) then
    return false;
  end if;
  update public.draw_players set has_guessed = true, score = score + 100
  where room_id = p_room_id and user_id = auth.uid();
  update public.draw_players set score = score + 50
  where room_id = p_room_id and user_id = v_room.current_drawer_id;
  select count(*) into v_remaining from public.draw_players
  where room_id = p_room_id and user_id <> v_room.current_drawer_id and has_guessed = false;
  if v_remaining = 0 then
    update public.draw_rooms
    set phase = 'reveal', round_ends_at = now() + interval '6 seconds', updated_at = now()
    where id = p_room_id;
  else
    update public.draw_rooms set updated_at = now() where id = p_room_id;
  end if;
  return true;
end;
$$;

grant execute on function public.check_draw_guess(uuid, text) to authenticated;

-- 12) Move the game forward when a phase deadline passes. Any member's
--     client may call it; the state checks make repeat/racing calls
--     harmless no-ops. Drawing expiry -> reveal (6s). Reveal expiry ->
--     next drawer, or finished after the last round. Picking expiry ->
--     the idle drawer is skipped (the round counts, no points).
create or replace function public.advance_draw_round(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
  v_seat integer;
  v_next uuid;
begin
  select * into v_room from public.draw_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' then
    return false;
  end if;
  if not exists (select 1 from public.draw_players where room_id = p_room_id and user_id = auth.uid()) then
    return false;
  end if;
  if v_room.round_ends_at is null or v_room.round_ends_at > now() then
    return false;
  end if;
  if v_room.phase = 'drawing' then
    update public.draw_rooms
    set phase = 'reveal', round_ends_at = now() + interval '6 seconds', updated_at = now()
    where id = p_room_id;
    return true;
  end if;
  if v_room.phase = 'picking' or v_room.phase = 'reveal' then
    if v_room.round_no >= v_room.max_rounds then
      update public.draw_rooms
      set status = 'finished', phase = null, current_word = null, current_drawer_id = null,
          round_ends_at = null, updated_at = now()
      where id = p_room_id;
      return true;
    end if;
    select seat into v_seat from public.draw_players
    where room_id = p_room_id and user_id = v_room.current_drawer_id;
    select user_id into v_next from public.draw_players
    where room_id = p_room_id and seat > coalesce(v_seat, -1)
    order by seat limit 1;
    if v_next is null then
      select user_id into v_next from public.draw_players
      where room_id = p_room_id order by seat limit 1;
    end if;
    update public.draw_rooms
    set round_no = v_room.round_no + 1, phase = 'picking', current_drawer_id = v_next,
        current_word = null, round_ends_at = now() + interval '30 seconds', updated_at = now()
    where id = p_room_id;
    update public.draw_players set has_guessed = false where room_id = p_room_id;
    return true;
  end if;
  return false;
end;
$$;

grant execute on function public.advance_draw_round(uuid) to authenticated;

-- 13) Play again: any member may reset a finished room back to waiting
--     with the same seats. Scores and used words reset; the host starts
--     the new game when ready.
create or replace function public.play_again_draw(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.draw_rooms%rowtype;
begin
  select * into v_room from public.draw_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'finished' then
    return false;
  end if;
  if not exists (select 1 from public.draw_players where room_id = p_room_id and user_id = auth.uid()) then
    return false;
  end if;
  update public.draw_rooms
  set status = 'waiting', phase = null, current_drawer_id = null, current_word = null,
      used_words = '[]'::jsonb, round_no = 0, max_rounds = 0, round_ends_at = null,
      updated_at = now()
  where id = p_room_id;
  update public.draw_players set score = 0, has_guessed = false where room_id = p_room_id;
  return true;
end;
$$;

grant execute on function public.play_again_draw(uuid) to authenticated;

-- No table grants: with RLS enabled and no policies, direct table access
-- is denied for every role; the RPCs above are the only access path.
