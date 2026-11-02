-- Sweet Smart Calendar — notification visibility fix
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Broadcast notifications are now visible ONLY to logged-in (registered)
-- users. Logged-out guests on the landing page can no longer read them.

drop policy if exists "public read active notifications" on public.admin_notifications;

drop policy if exists "registered read active notifications" on public.admin_notifications;
create policy "registered read active notifications"
  on public.admin_notifications for select
  to authenticated
  using (active = true);
