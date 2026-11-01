-- Sweet Smart Calendar — promote the super admin
-- Run this AFTER the admin registers in the app with WhatsApp 01797953059.
-- Supabase Dashboard: SQL Editor → New query → paste → Run.

update public.profiles
set role = 'super_admin',
    status = 'approved'
where whatsapp = '01797953059';
