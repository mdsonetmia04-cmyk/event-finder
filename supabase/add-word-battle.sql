-- Sweet Smart Calendar — Word Meaning Battle multiplayer migration v28
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- 1) word_rooms: one row per multiplayer room. The host creates a room
--    with a 6-character code (same alphabet as Ludo/Draw & Guess codes,
--    generated client-side); players join from the open lobby (waiting
--    rooms) or by entering the code. status moves waiting -> playing ->
--    finished. 2–4 players per room. Each match is 10 questions, 15
--    seconds each, with an 8-second reveal after every question.
--    phase tracks the round state: 'question' (15s) / 'reveal' (8s);
--    question_ends_at is the deadline of the CURRENT phase — any seated
--    member's client calls advance_word_round() when it expires.
--    current_q is the question index (0..9).
--
-- 2) THE CORRECT ANSWERS: correct_indices holds the 10 correct DISPLAY
--    indices (0..3, into each question's shuffled option order). The
--    host's client draws the match from the 300-word
--    banks (src/lib/words/bank-*.ts) and sends the ids, the shuffled
--    option orders and the correct display indices to
--    start_word_game(), which validates and stores them server-side.
--    There is NO select policy on word_rooms (and no policy at all on
--    any of the three tables): with RLS enabled and no policy, every
--    direct row access is denied. The ONLY read path is
--    get_word_room(), a SECURITY DEFINER RPC. It returns the CURRENT
--    question's id + display order only — never correct_indices, never
--    the other questions' ids — and the correct index for a question
--    only while phase = 'reveal', together with every player's pick
--    for that question. The full question list is returned only once
--    the room is finished (for the review section). Answers are
--    validated server-side by submit_word_answer(), which compares
--    against the stored correct index and returns only
--    accepted/not-accepted — never whether the pick was right.
--    (The banks themselves are client-side code, exactly as in solo
--    Word Meaning Battle, so a player could look an answer up in the bundle;
--    the room state itself never reveals correctness early.)
--
-- 3) word_players: one row per seat. Each row snapshots the player's
--    name and avatar_url (same as Ludo/Draw & Guess rooms) so the
--    scoreboard still reads correctly if a profile changes later.
--    score is MARKS: 1 per correct answer, 0 for wrong/timeout.
--    total_ms is the tiebreak: the sum of answer times in
--    milliseconds (a timeout counts the full 15,000 ms). seat is the
--    join order (0 = host). has_left marks a player who left mid-match:
--    their earned marks stay on the board, but they can no longer
--    answer — their remaining answers are forfeited.
--
-- 4) word_answers: one row per submitted answer (room, player,
--    question). The primary key makes double-answering impossible;
--    submit_word_answer() also checks under the room lock.
--
-- 5) All writes go through SECURITY DEFINER RPCs that lock the room row
--    (SELECT ... FOR UPDATE), so concurrent joins, answers and
--    round-advances serialise safely. Every RPC checks the caller is
--    approved; mutating RPCs check membership/role as well. Lobby
--    listing, code lookup and the live list are RPCs too, returning
--    only safe fields. Rooms stop being joinable/listable 1 hour after
--    their last update (same freshness rule as Ludo/Draw & Guess).
--
-- 6) Privacy: rooms, players and answers expose ONLY names, avatar
--    URLs, marks, answer times and game state — never WhatsApp numbers,
--    emails, or earnings. No function reads any private profile field;
--    the approved-caller test checks status only.
--
-- 7) This migration creates tables, indexes, functions and grants
--    only — it never touches storage.objects.

-- 1) Game rooms.
create table if not exists public.word_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  host_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  max_players integer not null check (max_players between 2 and 4),
  phase text check (phase in ('question', 'reveal')),
  question_ids jsonb not null default '[]'::jsonb,
  question_orders jsonb not null default '[]'::jsonb,
  correct_indices jsonb not null default '[]'::jsonb,
  current_q integer not null default 0,
  question_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.word_rooms enable row level security;

create index if not exists word_rooms_code_idx
  on public.word_rooms (code);

create index if not exists word_rooms_status_updated_at_idx
  on public.word_rooms (status, updated_at desc);

-- No policies on word_rooms: RLS enabled + no policy = every direct
-- access denied. Reads and writes go through the RPCs below.

-- 2) Seats.
create table if not exists public.word_players (
  room_id uuid not null references public.word_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  score integer not null default 0,
  total_ms bigint not null default 0,
  has_left boolean not null default false,
  seat integer not null,
  primary key (room_id, user_id)
);

alter table public.word_players enable row level security;

-- No policies on word_players either: RPC-gated, same as word_rooms.

create index if not exists word_players_room_seat_idx
  on public.word_players (room_id, seat);

-- 3) One answer per player per question.
create table if not exists public.word_answers (
  room_id uuid not null references public.word_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  q_index integer not null check (q_index between 0 and 9),
  picked integer not null check (picked between 0 and 3),
  correct boolean not null,
  ms integer not null default 0,
  primary key (room_id, user_id, q_index)
);

alter table public.word_answers enable row level security;

-- No policies on word_answers either: RPC-gated, same as the rest.

-- 4) The only read path for a room. Returns the room + players as one
--    JSON object. The current question's id + display order are
--    included while playing; the correct display index and every
--    player's pick for the question appear ONLY while phase =
--    'reveal'. The full question list + all answers are included ONLY
--    once the room is finished (review). correct_indices is NEVER
--    returned.
create or replace function public.get_word_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.word_rooms%rowtype;
  v_players jsonb;
  v_reveal jsonb;
  v_qid text;
  v_qorder jsonb;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved') then
    return null;
  end if;
  select * into v_room from public.word_rooms where id = p_room_id;
  if not found then
    return null;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'user_id', qp.user_id,
      'name', qp.name,
      'avatar_url', qp.avatar_url,
      'score', qp.score,
      'total_ms', qp.total_ms,
      'seat', qp.seat,
      'has_left', qp.has_left,
      'answered', exists (select 1 from public.word_answers qa
        where qa.room_id = p_room_id and qa.user_id = qp.user_id
          and qa.q_index = v_room.current_q)
    ) order by qp.seat), '[]'::jsonb)
  into v_players
  from public.word_players qp
  where qp.room_id = p_room_id;
  v_qid := case when v_room.status = 'playing' then v_room.question_ids ->> v_room.current_q else null end;
  v_qorder := case when v_room.status = 'playing' then v_room.question_orders -> v_room.current_q else null end;
  if v_room.status = 'playing' and v_room.phase = 'reveal' then
    select jsonb_build_object(
      'correct', (v_room.correct_indices ->> v_room.current_q)::int,
      'answers', coalesce(jsonb_agg(jsonb_build_object(
        'user_id', qa.user_id,
        'picked', qa.picked,
        'correct', qa.correct,
        'ms', qa.ms
      ) order by qa.user_id), '[]'::jsonb)
    ) into v_reveal
    from public.word_answers qa
    where qa.room_id = p_room_id and qa.q_index = v_room.current_q;
  else
    v_reveal := null;
  end if;
  return jsonb_build_object(
    'id', v_room.id,
    'code', v_room.code,
    'host_id', v_room.host_id,
    'status', v_room.status,
    'max_players', v_room.max_players,
    'phase', v_room.phase,
    'current_q', v_room.current_q,
    'question_id', v_qid,
    'question_order', v_qorder,
    'reveal', v_reveal,
    'question_ends_at', v_room.question_ends_at,
    'question_ids', case when v_room.status = 'finished' then v_room.question_ids else '[]'::jsonb end,
    'question_orders', case when v_room.status = 'finished' then v_room.question_orders else '[]'::jsonb end,
    'all_answers', case when v_room.status = 'finished' then (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', qa.user_id,
        'q_index', qa.q_index,
        'picked', qa.picked,
        'correct', qa.correct,
        'ms', qa.ms
      )), '[]'::jsonb)
      from public.word_answers qa where qa.room_id = p_room_id
    ) else '[]'::jsonb end,
    'created_at', v_room.created_at,
    'updated_at', v_room.updated_at,
    'players', v_players
  );
end;
$$;

grant execute on function public.get_word_room(uuid) to authenticated;

-- 5) Lobby listing: waiting rooms updated within the last hour, newest
--    first. Safe fields only — no questions, no answers.
create or replace function public.list_word_rooms()
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
      (select qp.name from public.word_players qp where qp.room_id = r.id order by qp.seat limit 1),
      (select count(*) from public.word_players qp where qp.room_id = r.id and qp.has_left = false),
      r.max_players, r.updated_at
    from public.word_rooms r
    where r.status = 'waiting'
      and r.updated_at > now() - interval '1 hour'
    order by r.updated_at desc
    limit 20;
end;
$$;

grant execute on function public.list_word_rooms() to authenticated;

-- 6) Code lookup for join-by-code: waiting or playing rooms only. The
--    caller checks freshness (1 hour) itself, like the Ludo/Draw &
--    Guess chip resolvers do.
create or replace function public.find_word_room(p_code text)
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
      (select count(*) from public.word_players qp where qp.room_id = r.id and qp.has_left = false),
      r.max_players, r.updated_at
    from public.word_rooms r
    where r.code = upper(trim(p_code))
      and r.status in ('waiting', 'playing')
    limit 1;
end;
$$;

grant execute on function public.find_word_room(text) to authenticated;

-- 7) Create a room and seat the host (seat 0). The code must use the
--    shared room-code alphabet (no I/L/O/0/1 look-alikes). Returns the
--    room id, or null on any failure (a code collision returns null so
--    the client can retry with a fresh code).
create or replace function public.create_word_room(p_code text, p_max_players integer)
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
  if p_max_players < 2 or p_max_players > 4 then
    return null;
  end if;
  if v_code !~ '^[A-HJ-KM-NP-Z2-9]{6}$' then
    return null;
  end if;
  select * into v_me from public.profiles where id = auth.uid() and status = 'approved';
  if not found then
    return null;
  end if;
  insert into public.word_rooms (code, host_id, status, max_players)
  values (v_code, auth.uid(), 'waiting', p_max_players)
  returning id into v_id;
  insert into public.word_players (room_id, user_id, name, avatar_url, seat)
  values (v_id, auth.uid(), v_me.name, v_me.avatar_url, 0);
  return v_id;
exception
  when unique_violation then
    return null;
end;
$$;

grant execute on function public.create_word_room(text, integer) to authenticated;

-- 8) Join a waiting room. Idempotent: a seated player gets true again.
--    The room row is locked so two joins racing for the last seat
--    cannot both land.
create or replace function public.join_word_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.word_rooms%rowtype;
  v_me public.profiles%rowtype;
  v_count integer;
  v_seat integer;
begin
  select * into v_me from public.profiles where id = auth.uid() and status = 'approved';
  if not found then
    return false;
  end if;
  select * into v_room from public.word_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if exists (select 1 from public.word_players where room_id = p_room_id and user_id = auth.uid()) then
    return true;
  end if;
  if v_room.status <> 'waiting' then
    return false;
  end if;
  if v_room.updated_at <= now() - interval '1 hour' then
    return false;
  end if;
  select count(*) into v_count from public.word_players where room_id = p_room_id and has_left = false;
  if v_count >= v_room.max_players then
    return false;
  end if;
  -- Seat numbers must stay unique: a rejoiner after a leave would reuse
  -- a seat if we used the count, and ranking ties fall back to seat.
  select coalesce(max(seat), -1) + 1 into v_seat from public.word_players where room_id = p_room_id;
  insert into public.word_players (room_id, user_id, name, avatar_url, seat)
  values (p_room_id, auth.uid(), v_me.name, v_me.avatar_url, v_seat);
  update public.word_rooms set updated_at = now() where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.join_word_room(uuid) to authenticated;

-- 9) Leave a room. Waiting: the host deletes the whole room; anyone
--    else removes only themselves. Playing: the leaver is marked has_left
--    — their earned marks stay on the board, but they can no longer
--    answer, so their remaining answers are forfeited. Finished:
--    leaving just navigates away; the board keeps every seat.
create or replace function public.leave_word_room(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.word_rooms%rowtype;
begin
  select * into v_room from public.word_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status = 'finished' then
    return true;
  end if;
  if v_room.status = 'waiting' then
    if v_room.host_id = auth.uid() then
      delete from public.word_rooms where id = p_room_id;
    else
      delete from public.word_players where room_id = p_room_id and user_id = auth.uid();
      update public.word_rooms set updated_at = now() where id = p_room_id;
    end if;
    return true;
  end if;
  -- Playing: mark has_left, keep the seat and the score.
  update public.word_players set has_left = true
  where room_id = p_room_id and user_id = auth.uid();
  update public.word_rooms set updated_at = now() where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.leave_word_room(uuid) to authenticated;

-- 10) Start the match: host-only, waiting room, 2+ seated players.
--     The host's client drew the 10 questions from the verified banks
--     and sends their ids, shuffled option orders and correct display
--     indices; the server validates the shape (10 distinct W###
--     ids, each order a permutation of 0,1,2,3, each correct index
--     0..3) and stores them — the correct indices never leave the
--     server until a question's reveal. Question 1 gets 15 seconds.
create or replace function public.start_word_game(p_room_id uuid, p_question_ids jsonb, p_orders jsonb, p_correct jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.word_rooms%rowtype;
  v_count integer;
  v_id text;
  v_order jsonb;
  v_seen text[] := '{}';
  i integer;
begin
  if jsonb_array_length(p_question_ids) <> 10
     or jsonb_array_length(p_orders) <> 10
     or jsonb_array_length(p_correct) <> 10 then
    return false;
  end if;
  for i in 0..9 loop
    v_id := p_question_ids ->> i;
    if v_id is null or v_id !~ '^W[0-9]{3}$' then
      return false;
    end if;
    if v_id = any (v_seen) then
      return false;
    end if;
    v_seen := array_append(v_seen, v_id);
    v_order := p_orders -> i;
    if jsonb_array_length(v_order) <> 4 then
      return false;
    end if;
    if not (v_order @> '0'::jsonb and v_order @> '1'::jsonb and v_order @> '2'::jsonb and v_order @> '3'::jsonb) then
      return false;
    end if;
    if (p_correct ->> i) is null then
      return false;
    end if;
    if (p_correct ->> i)::int < 0 or (p_correct ->> i)::int > 3 then
      return false;
    end if;
  end loop;
  select * into v_room from public.word_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.host_id <> auth.uid() then
    return false;
  end if;
  if v_room.status <> 'waiting' then
    return false;
  end if;
  select count(*) into v_count from public.word_players where room_id = p_room_id and has_left = false;
  if v_count < 2 then
    return false;
  end if;
  delete from public.word_answers where room_id = p_room_id;
  update public.word_players set score = 0, total_ms = 0, has_left = false where room_id = p_room_id;
  update public.word_rooms
  set status = 'playing', phase = 'question', current_q = 0,
      question_ids = p_question_ids, question_orders = p_orders, correct_indices = p_correct,
      question_ends_at = now() + interval '15 seconds', updated_at = now()
  where id = p_room_id;
  return true;
exception
  when others then
    return false;
end;
$$;

grant execute on function public.start_word_game(uuid, jsonb, jsonb, jsonb) to authenticated;

-- 11) Submit an answer: the server checks it against the stored
--     correct display index. Returns true only when the answer was
--     accepted — never whether it was right (correctness is revealed
--     to everyone when the question's reveal phase starts). One answer
--     per player per question; late answers (after the 15-second
--     deadline) are refused. The answer time counts toward the
--     tiebreak: fastest total time wins a marks tie.
create or replace function public.submit_word_answer(p_room_id uuid, p_pick integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.word_rooms%rowtype;
  v_remaining_ms integer;
  v_taken_ms integer;
  v_correct boolean;
begin
  if p_pick < 0 or p_pick > 3 then
    return false;
  end if;
  select * into v_room from public.word_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' or v_room.phase <> 'question' then
    return false;
  end if;
  if v_room.question_ends_at is null or v_room.question_ends_at <= now() then
    return false;
  end if;
  if not exists (select 1 from public.word_players
                 where room_id = p_room_id and user_id = auth.uid() and has_left = false) then
    return false;
  end if;
  if exists (select 1 from public.word_answers
             where room_id = p_room_id and user_id = auth.uid() and q_index = v_room.current_q) then
    return false;
  end if;
  v_remaining_ms := greatest(0, floor(extract(epoch from (v_room.question_ends_at - now())) * 1000))::integer;
  v_taken_ms := 15000 - v_remaining_ms;
  v_correct := p_pick = (v_room.correct_indices ->> v_room.current_q)::int;
  insert into public.word_answers (room_id, user_id, q_index, picked, correct, ms)
  values (p_room_id, auth.uid(), v_room.current_q, p_pick, v_correct, v_taken_ms);
  update public.word_players
  set score = score + (case when v_correct then 1 else 0 end),
      total_ms = total_ms + v_taken_ms
  where room_id = p_room_id and user_id = auth.uid();
  update public.word_rooms set updated_at = now() where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.submit_word_answer(uuid, integer) to authenticated;

-- 12) Move the match forward when a phase deadline passes. Any seated
--     member's client may call it; the state checks make repeat/racing
--     calls harmless no-ops. Question expiry -> reveal (8s); players
--     who never answered that question count the full 15 seconds
--     toward the tiebreak. Reveal expiry -> next question, or finished
--     after question 10.
create or replace function public.advance_word_round(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.word_rooms%rowtype;
begin
  select * into v_room from public.word_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'playing' then
    return false;
  end if;
  if not exists (select 1 from public.word_players
                 where room_id = p_room_id and user_id = auth.uid() and has_left = false) then
    return false;
  end if;
  if v_room.question_ends_at is null or v_room.question_ends_at > now() then
    return false;
  end if;
  if v_room.phase = 'question' then
    update public.word_players qp
    set total_ms = total_ms + 15000
    where qp.room_id = p_room_id and qp.has_left = false
      and not exists (select 1 from public.word_answers qa
        where qa.room_id = p_room_id and qa.user_id = qp.user_id
          and qa.q_index = v_room.current_q);
    update public.word_rooms
    set phase = 'reveal', question_ends_at = now() + interval '8 seconds', updated_at = now()
    where id = p_room_id;
    return true;
  end if;
  if v_room.phase = 'reveal' then
    if v_room.current_q >= 9 then
      update public.word_rooms
      set status = 'finished', phase = null, question_ends_at = null, updated_at = now()
      where id = p_room_id;
      return true;
    end if;
    update public.word_rooms
    set current_q = v_room.current_q + 1, phase = 'question',
        question_ends_at = now() + interval '15 seconds', updated_at = now()
    where id = p_room_id;
    return true;
  end if;
  return false;
end;
$$;

grant execute on function public.advance_word_round(uuid) to authenticated;

-- 13) Play again: any seated member may reset a finished room back to
--     waiting with the same seats. Marks, times and answers reset; the
--     host draws a fresh set of 10 questions when starting again.
create or replace function public.play_again_word(p_room_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.word_rooms%rowtype;
begin
  select * into v_room from public.word_rooms where id = p_room_id for update;
  if not found then
    return false;
  end if;
  if v_room.status <> 'finished' then
    return false;
  end if;
  if not exists (select 1 from public.word_players where room_id = p_room_id and user_id = auth.uid()) then
    return false;
  end if;
  delete from public.word_answers where room_id = p_room_id;
  update public.word_players set score = 0, total_ms = 0, has_left = false where room_id = p_room_id;
  update public.word_rooms
  set status = 'waiting', phase = null, current_q = 0,
      question_ids = '[]'::jsonb, question_orders = '[]'::jsonb, correct_indices = '[]'::jsonb,
      question_ends_at = null, updated_at = now()
  where id = p_room_id;
  return true;
end;
$$;

grant execute on function public.play_again_word(uuid) to authenticated;

-- 14) Live list for /games/live: playing rooms updated within the last
--     hour, newest first. Spectator-safe fields only — id, code,
--     updated_at + players (user_id, name, avatar_url, score, seat).
--     NO question ids, NO orders, NO answers: nothing about the match
--     content can leak through this path.
create or replace function public.list_live_word_rooms()
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
          'user_id', qp.user_id,
          'name', qp.name,
          'avatar_url', qp.avatar_url,
          'score', qp.score,
          'seat', qp.seat
        ) order by qp.seat), '[]'::jsonb)
       from public.word_players qp where qp.room_id = r.id)
    from public.word_rooms r
    where r.status = 'playing'
      and r.updated_at > now() - interval '1 hour'
    order by r.updated_at desc
    limit 20;
end;
$$;

grant execute on function public.list_live_word_rooms() to authenticated;

-- No table grants: with RLS enabled and no policies, direct table access
-- is denied for every role; the RPCs above are the only access path.
