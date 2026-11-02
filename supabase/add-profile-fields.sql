-- Sweet Smart Calendar — profile fields migration
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Adds optional profile fields (gmail, team_number, gender, blood_group) that
-- each user fills in on their own /profile page, plus a SECURITY DEFINER
-- function so users can update ONLY these four columns on their own row.
-- (role / status / name / whatsapp stay admin-controlled via existing RLS.)

-- 1) New columns (all optional)
alter table public.profiles
  add column if not exists gmail text,
  add column if not exists team_number text,
  add column if not exists gender text,
  add column if not exists blood_group text;

-- 2) Users update only their own four profile fields.
--    SECURITY DEFINER runs as the table owner, so no RLS policy change is
--    needed and role/status can never be escalated through this path.
create or replace function public.update_own_profile(
  p_gmail text,
  p_team_number text,
  p_gender text,
  p_blood_group text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set gmail       = nullif(trim(p_gmail), ''),
      team_number = nullif(trim(p_team_number), ''),
      gender      = nullif(trim(p_gender), ''),
      blood_group = nullif(trim(p_blood_group), '')
  where id = auth.uid();
end;
$$;

grant execute on function public.update_own_profile(text, text, text, text) to authenticated;
