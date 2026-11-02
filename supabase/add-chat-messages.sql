-- Sweet Smart Calendar — "Chat with Admin" migration v3
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Creates the admin_messages table: a private thread between each student
-- and the super admin. Students can read their own thread and send messages
-- as 'user'; the super admin can read and reply to every thread.

create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sender text not null check (sender in ('user', 'admin')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists admin_messages_user_id_created_idx
  on public.admin_messages (user_id, created_at);

alter table public.admin_messages enable row level security;

-- Student: read own thread
drop policy if exists "user read own messages" on public.admin_messages;
create policy "user read own messages"
  on public.admin_messages for select
  using (auth.uid() = user_id);

-- Student: send a message (only into own thread, only as 'user')
drop policy if exists "user send message" on public.admin_messages;
create policy "user send message"
  on public.admin_messages for insert
  with check (auth.uid() = user_id and sender = 'user');

-- Super admin: read, reply to, and delete every thread
drop policy if exists "super admin all messages" on public.admin_messages;
create policy "super admin all messages"
  on public.admin_messages for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Live updates: publish the table on the realtime publication (no-op if already added)
do $$
begin
  execute 'alter publication supabase_realtime add table public.admin_messages';
exception when duplicate_object then
  null;
end $$;
