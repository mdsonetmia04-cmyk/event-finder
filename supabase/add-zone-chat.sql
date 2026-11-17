-- Sweet Smart Calendar — Gaming Zone group chat migration v13
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- 1) zone_chat_messages: one shared inbox for the Gaming Zone. Every
--    approved user can read all messages and send their own. Each message
--    snapshots the sender's name and avatar_url (same as ludo_messages)
--    so the chat still reads correctly if a profile changes later.
--    Messages are capped at 500 characters and can never be edited or
--    deleted (no update/delete policies).
--
-- 2) zone_chat_reads: per-message read receipts. One row per
--    (message, reader). Readers record their own rows through the
--    mark_zone_chat_read RPC, which never records the message author,
--    so the UI's "Seen by N" count is always other readers. The table
--    holds opaque ids only — no names, no phone numbers.
--
-- 3) get_live_users(): SECURITY DEFINER read returning ONLY id, name,
--    avatar_url and last_seen for approved, non-demo users whose last
--    heartbeat is within 3 minutes — the same "live now" window the app
--    uses client-side (src/lib/presence.ts). No RLS change exposes other
--    users' profile rows; the role is NOT filtered, so the super admin
--    (the teacher) shows as live too. Demo accounts (01900000000,
--    01900000001) are excluded, same as the leaderboard.
--
-- 4) Privacy: names + avatar URLs only — never WhatsApp numbers, emails
--    or earnings. The approved-caller test checks status only.
--
-- 5) Both tables are added to the realtime publication so the chat page
--    receives live INSERT events (same pattern as admin_messages).
--    This migration creates tables, indexes, policies, functions and
--    grants only — it never touches storage.objects.

-- 1) Shared chat messages.
create table if not exists public.zone_chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar_url text,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 500),
  created_at timestamptz not null default now()
);

alter table public.zone_chat_messages enable row level security;

create index if not exists zone_chat_messages_created_idx
  on public.zone_chat_messages (created_at);

drop policy if exists "zone chat read" on public.zone_chat_messages;
create policy "zone chat read"
  on public.zone_chat_messages for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

drop policy if exists "zone chat send" on public.zone_chat_messages;
create policy "zone chat send"
  on public.zone_chat_messages for insert
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

-- No update/delete policies on zone_chat_messages: denied by default under RLS.

-- 2) Read receipts.
create table if not exists public.zone_chat_reads (
  message_id bigint not null references public.zone_chat_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.zone_chat_reads enable row level security;

create index if not exists zone_chat_reads_message_idx
  on public.zone_chat_reads (message_id);

-- Approved users can read all receipts: the UI needs per-message counts,
-- and rows contain only opaque ids (no private profile fields).
drop policy if exists "zone chat reads read" on public.zone_chat_reads;
create policy "zone chat reads read"
  on public.zone_chat_reads for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved')
  );

drop policy if exists "zone chat reads insert own" on public.zone_chat_reads;
create policy "zone chat reads insert own"
  on public.zone_chat_reads for insert
  with check (user_id = auth.uid());

-- No update/delete policies on zone_chat_reads: denied by default under RLS.

-- 3) Live-users read: id + name + avatar + last_seen only, heartbeat
--    within the last 3 minutes. SECURITY DEFINER so no profile-row RLS
--    change is needed; the caller must be approved.
create or replace function public.get_live_users()
returns table (user_id uuid, display_name text, avatar_url text, last_seen timestamptz)
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
    select p.id, p.name, p.avatar_url, p.last_seen
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

-- 4) Record "I have seen these messages" for the calling user.
--    SECURITY DEFINER so any logged-in user can mark their own reads.
--    The author's own messages are skipped server-side, so "Seen by N"
--    always counts other readers. Idempotent: re-marking is a no-op.
create or replace function public.mark_zone_chat_read(p_message_ids bigint[])
returns void
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

  insert into public.zone_chat_reads (message_id, user_id)
  select distinct m.id, auth.uid()
  from unnest(p_message_ids) as m(id)
  where exists (
    select 1 from public.zone_chat_messages zm
    where zm.id = m.id and zm.user_id <> auth.uid()
  )
  on conflict (message_id, user_id) do nothing;
end;
$$;

grant execute on function public.mark_zone_chat_read(bigint[]) to authenticated;

-- 5) Grants.
grant select, insert on public.zone_chat_messages to authenticated;
grant select, insert on public.zone_chat_reads to authenticated;

-- 6) Live updates: publish both tables on the realtime publication
--    (no-op if already added).
do $$
begin
  execute 'alter publication supabase_realtime add table public.zone_chat_messages';
exception when duplicate_object then
  null;
end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.zone_chat_reads';
exception when duplicate_object then
  null;
end $$;
