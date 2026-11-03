-- Sweet Smart Calendar — announcement read receipts migration v11
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Records which user has seen which announcement. The popup marks a
-- notification read the moment it is shown, so a dismissed announcement
-- never reappears (server-side truth, not just localStorage). The admin
-- panel shows per-announcement read counts.

create table if not exists public.notification_reads (
  notification_id uuid not null references public.admin_notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

alter table public.notification_reads enable row level security;

-- A user can read their own receipts
drop policy if exists "users read own receipts" on public.notification_reads;
create policy "users read own receipts"
  on public.notification_reads for select
  to authenticated
  using (user_id = auth.uid());

-- Super admin: full control (for read-count stats)
drop policy if exists "super admin all receipts" on public.notification_reads;
create policy "super admin all receipts"
  on public.notification_reads for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- RPC: record "I have seen this notification" for the calling user.
-- SECURITY DEFINER so any logged-in user can mark their own read.
create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_reads (notification_id, user_id)
  values (p_notification_id, auth.uid())
  on conflict (notification_id, user_id) do nothing;
end;
$$;

grant execute on function public.mark_notification_read(uuid) to authenticated;
