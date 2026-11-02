-- Sweet Smart Calendar — admin notifications migration v5
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Broadcast notifications from the super admin. Every website visitor
-- (including logged-out guests) can read ACTIVE notifications, so they can
-- be shown as a popup across the whole site. Only the super admin can
-- create / edit / delete them.

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  active boolean not null default true
);

alter table public.admin_notifications enable row level security;

-- Everyone, including logged-out visitors, can read active notifications
drop policy if exists "public read active notifications" on public.admin_notifications;
create policy "public read active notifications"
  on public.admin_notifications for select
  using (active = true);

-- Super admin: full control
drop policy if exists "super admin all notifications" on public.admin_notifications;
create policy "super admin all notifications"
  on public.admin_notifications for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Live updates: publish the table on the realtime publication (no-op if already added)
do $$
begin
  execute 'alter publication supabase_realtime add table public.admin_notifications';
exception when duplicate_object then
  null;
end $$;
