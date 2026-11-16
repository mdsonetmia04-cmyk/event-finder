-- Sweet Smart Calendar — Ludo Gaming Zone migration v11
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- 1) ludo_rooms: one row per game room. The host creates a room with a
--    6-character code generated client-side; players join from the open
--    lobby (waiting rooms) or by entering the code. players is an array
--    of {user_id, name, avatar_url, color} with user_id stored as a
--    string; state holds the full engine state including move_no and is
--    null while the room is waiting. status moves waiting -> playing ->
--    finished; winner_id is set when the game ends.
--
-- 2) ludo_messages: per-room chat. Each message snapshots the sender's
--    name and avatar_url so the chat still reads correctly if a profile
--    changes later. Messages are capped at 200 characters and can only
--    be read or sent by members of the parent room; they can never be
--    edited or deleted (no update/delete policies).
--
-- 3) Policies: the membership test is a containment check on players
--    (user_id stored as text), and the approved-caller test requires a
--    profiles row with status 'approved'. Approved students AND the
--    super admin both have status 'approved', so no admin special-case
--    is needed. The update policy carries a join arm (a non-member may
--    update a waiting room with a free seat to add themselves) and a
--    leave arm (a player may update a waiting room to remove
--    themselves); see the comment above that policy.
--
-- 4) Privacy: rooms and messages expose ONLY names, avatar URLs, and
--    game state — never WhatsApp numbers, emails, or earnings. No
--    policy reads any private profile field; the approved-caller test
--    checks status only.
--
-- 5) updated_at is set by clients on every write (no triggers). This
--    migration creates tables, indexes, policies, and grants only.

-- 1) Game rooms.
create table if not exists public.ludo_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  host_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  max_players integer not null check (max_players between 2 and 4),
  players jsonb not null default '[]'::jsonb,
  state jsonb,
  winner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ludo_rooms enable row level security;

create index if not exists ludo_rooms_status_updated_at_idx
  on public.ludo_rooms (status, updated_at desc);

drop policy if exists "ludo rooms visible" on public.ludo_rooms;
create policy "ludo rooms visible"
  on public.ludo_rooms for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
    and (
      status = 'waiting'
      or players @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
    )
  );

drop policy if exists "ludo rooms create" on public.ludo_rooms;
create policy "ludo rooms create"
  on public.ludo_rooms for insert
  with check (
    host_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

-- Join/leave arms: the second USING arm lets a non-member JOIN a waiting
-- room that still has a free seat by adding themselves to players; the
-- WITH CHECK status='waiting' arm lets a player LEAVE a waiting room by
-- removing themselves (a plain membership with-check would block
-- self-removal, since the new row no longer contains them).
drop policy if exists "ludo rooms play" on public.ludo_rooms;
create policy "ludo rooms play"
  on public.ludo_rooms for update
  using (
    players @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
    or (
      status = 'waiting'
      and jsonb_array_length(players) < max_players
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
    )
  )
  with check (
    players @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
    or status = 'waiting'
  );

drop policy if exists "ludo rooms host cancel" on public.ludo_rooms;
create policy "ludo rooms host cancel"
  on public.ludo_rooms for delete
  using (host_id = auth.uid() and status = 'waiting');

-- 2) Room chat.
create table if not exists public.ludo_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.ludo_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 200),
  created_at timestamptz not null default now()
);

alter table public.ludo_messages enable row level security;

create index if not exists ludo_messages_room_created_idx
  on public.ludo_messages (room_id, created_at);

drop policy if exists "ludo messages read" on public.ludo_messages;
create policy "ludo messages read"
  on public.ludo_messages for select
  using (
    exists (
      select 1 from public.ludo_rooms r
      where r.id = ludo_messages.room_id
        and r.players @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
    )
  );

drop policy if exists "ludo messages send" on public.ludo_messages;
create policy "ludo messages send"
  on public.ludo_messages for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.ludo_rooms r
      where r.id = ludo_messages.room_id
        and r.players @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
    )
  );

-- No update/delete policies on ludo_messages: denied by default under RLS.

-- 3) Grants.
grant select, insert, update, delete on public.ludo_rooms to authenticated;
grant select, insert on public.ludo_messages to authenticated;
