-- Sweet Smart Calendar — per-student alerts migration v7
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Adds a user_id column to admin_notifications:
--   user_id NULL  -> broadcast notification (everyone, as before)
--   user_id set   -> private alert visible ONLY to that student
-- The read policy is tightened so a student can only read broadcasts plus
-- their own alerts. The super admin keeps full access through the existing
-- "super admin all notifications" policy.

alter table public.admin_notifications
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;

-- Replace the broadcast-only read policy with one that also gates private alerts
drop policy if exists "registered read active notifications" on public.admin_notifications;
drop policy if exists "registered read own and broadcast notifications" on public.admin_notifications;
create policy "registered read own and broadcast notifications"
  on public.admin_notifications for select
  to authenticated
  using (active = true and (user_id is null or user_id = auth.uid()));
