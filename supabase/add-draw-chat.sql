-- Sweet Smart Calendar — Draw & Guess room chat migration v21
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- 1) draw_messages: per-room chat, mirroring ludo_messages (migration
--    v11). Each message snapshots the sender's name and avatar_url so
--    the chat still reads correctly if a profile changes later.
--    Messages are capped at 200 characters and can only be read or
--    sent by players seated in the parent room; they can never be
--    edited or deleted (no update/delete policies). Messages vanish
--    with their room (ON DELETE CASCADE).
--
-- 2) THE MEMBERSHIP CHECK MUST BE SECURITY DEFINER: draw_players has
--    RLS enabled with ZERO policies (migration v16 — the hidden-word
--    protection), so a plain policy subquery on draw_players would see
--    zero rows for every caller and no one could ever read or send.
--    is_draw_room_player() runs as the function owner, so it can see
--    the seats and answer the membership question for the policies.
--
-- 3) Privacy: messages expose ONLY names, avatar URLs and the message
--    body — never WhatsApp numbers, emails, or earnings. The helper
--    checks seat membership only; it reads no private profile field.
--
-- 4) Realtime: clients subscribe to INSERTs on this table (filtered by
--    room_id), so the table is added to the supabase_realtime
--    publication with the same exception-tolerant pattern as the zone
--    chat tables (migration v13).
--
-- This migration creates a table, an index, a function, policies and
-- grants only — it never touches storage.objects.

-- 1) Room chat.
create table if not exists public.draw_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.draw_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 200),
  created_at timestamptz not null default now()
);

alter table public.draw_messages enable row level security;

create index if not exists draw_messages_room_created_idx
  on public.draw_messages (room_id, created_at);

-- 2) Membership helper. The policies below are dropped first so the
-- function can be dropped and recreated on re-runs (a function with
-- dependent policies cannot be dropped).
drop policy if exists "draw messages read" on public.draw_messages;
drop policy if exists "draw messages send" on public.draw_messages;
drop function if exists public.is_draw_room_player(uuid);
create function public.is_draw_room_player(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.draw_players
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

comment on function public.is_draw_room_player(uuid) is
  'True when the caller holds a seat in the given Draw & Guess room. SECURITY DEFINER because draw_players has RLS enabled with no policies, so a policy-time subquery would see no rows.';

drop policy if exists "draw messages read" on public.draw_messages;
create policy "draw messages read"
  on public.draw_messages for select
  using (public.is_draw_room_player(room_id));

drop policy if exists "draw messages send" on public.draw_messages;
create policy "draw messages send"
  on public.draw_messages for insert
  with check (
    user_id = auth.uid()
    and public.is_draw_room_player(room_id)
  );

-- No update/delete policies on draw_messages: denied by default under RLS.

-- 3) Grants.
grant select, insert on public.draw_messages to authenticated;
grant execute on function public.is_draw_room_player(uuid) to authenticated;

-- 4) Realtime publication (INSERTs only; the client filters by room_id).
do $$
begin
  execute 'alter publication supabase_realtime add table public.draw_messages';
exception when duplicate_object then
  null;
end $$;
