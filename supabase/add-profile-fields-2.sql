-- Sweet Smart Calendar — profile fields migration v2
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Adds 7 more optional student profile fields (full_name, mobile_number,
-- date_of_birth, district, last_education, skills_interests, facebook_link)
-- and replaces update_own_profile with an 11-parameter version so students
-- can update all their own optional fields — and nothing else
-- (role / status / name / whatsapp stay admin-controlled via existing RLS).

-- 1) Drop the old 4-parameter version to avoid overload confusion
drop function if exists public.update_own_profile(text, text, text, text);

-- 2) New columns (all optional)
alter table public.profiles
  add column if not exists full_name text,
  add column if not exists mobile_number text,
  add column if not exists date_of_birth date,
  add column if not exists district text,
  add column if not exists last_education text,
  add column if not exists skills_interests text,
  add column if not exists facebook_link text;

-- 3) One RPC for all 11 optional fields. SECURITY DEFINER runs as the table
--    owner, so no RLS policy change is needed and role/status can never be
--    escalated through this path.
create or replace function public.update_own_profile(
  p_gmail text,
  p_team_number text,
  p_gender text,
  p_blood_group text,
  p_full_name text,
  p_mobile_number text,
  p_date_of_birth text,
  p_district text,
  p_last_education text,
  p_skills_interests text,
  p_facebook_link text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set gmail            = nullif(trim(p_gmail), ''),
      team_number      = nullif(trim(p_team_number), ''),
      gender           = nullif(trim(p_gender), ''),
      blood_group      = nullif(trim(p_blood_group), ''),
      full_name        = nullif(trim(p_full_name), ''),
      mobile_number    = nullif(trim(p_mobile_number), ''),
      date_of_birth    = case when nullif(trim(p_date_of_birth), '') is null
                              then null
                              else trim(p_date_of_birth)::date end,
      district         = nullif(trim(p_district), ''),
      last_education   = nullif(trim(p_last_education), ''),
      skills_interests = nullif(trim(p_skills_interests), ''),
      facebook_link    = nullif(trim(p_facebook_link), '')
  where id = auth.uid();
end;
$$;

grant execute on function public.update_own_profile(text, text, text, text, text, text, text, text, text, text, text) to authenticated;
