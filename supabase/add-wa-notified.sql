-- Sweet Smart Calendar — WhatsApp approval-notify flag migration v9
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Adds wa_notified to public.profiles: the admin panel's one-tap WhatsApp
-- button sets it true after the admin sends the approval notification, so
-- the panel can show who has already been notified. No RLS change needed:
-- the existing "admin update profiles" policy already lets the super admin
-- write it, and students never need to read or write it.

alter table public.profiles
  add column if not exists wa_notified boolean not null default false;
