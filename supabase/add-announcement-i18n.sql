-- Sweet Smart Calendar — bilingual announcements migration v10
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Announcements were single-language (title/body), so English users saw
-- Bengali text. These columns let the admin publish EN + BN versions;
-- the popup picks the visitor's language with fallback to whichever exists.

alter table public.admin_notifications
  add column if not exists title_en text,
  add column if not exists body_en text,
  add column if not exists title_bn text,
  add column if not exists body_bn text;

-- Backfill from the legacy single-language columns
update public.admin_notifications
set title_en = coalesce(title_en, title),
    body_en  = coalesce(body_en,  body),
    title_bn = coalesce(title_bn, title),
    body_bn  = coalesce(body_bn,  body)
where title_en is null or body_en is null or title_bn is null or body_bn is null;
