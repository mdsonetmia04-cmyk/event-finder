-- Sweet Smart Calendar — avatars + daily/weekly leaderboard migration v10
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- 1) profiles.avatar_url: optional public URL of the user's profile picture.
--    Set only through the update_own_avatar RPC (SECURITY DEFINER, sets ONLY
--    avatar_url for auth.uid()). Other users never see anything except the
--    picture + name, via get_leaderboard only — no RLS change exposes other
--    users' private profile fields.
--
-- 2) Storage bucket 'avatars' (public read). Each user may upload / replace /
--    delete only objects under their own path (<user_id>/avatar.<ext>).
--    Public read is required so every approved user can see leaderboard
--    pictures; object paths are unguessable UUIDs.
--
-- 3) profile_daily_seconds: per-user, per-day active seconds, built from the
--    same heartbeat delta as profiles.total_seconds and the monthly table.
--    Day keys are Asia/Dhaka calendar dates ('YYYY-MM-DD'), matching the
--    site's clock. Daily / weekly boards accumulate from the day this
--    migration runs; the monthly and all-time boards are unchanged.
--
-- 4) heartbeat() is extended to upsert the current day's row with the exact
--    same capped delta it already adds to total_seconds and the monthly
--    table. Behaviour for total_seconds / first_seen / last_seen / monthly
--    is unchanged.
--
-- 5) get_leaderboard(p_period, p_limit) is replaced (return type gains
--    avatar_url, so the old version is dropped first). Periods: 'day' =
--    today, 'week' = last 7 days including today, 'month' = this month,
--    anything else = all time. It returns ONLY display names + seconds +
--    an is_you flag + avatar_url — never WhatsApp numbers, emails, or
--    earnings. Only approved students appear; the super admin and the two
--    demo accounts (Demo User, Play Reviewer) are excluded.
--    Pending/rejected callers get an empty set.

-- 1) Avatar URL column.
alter table public.profiles
  add column if not exists avatar_url text;

-- Avatar update: the caller may set ONLY their own avatar_url (empty = clear).
create or replace function public.update_own_avatar(p_avatar_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set avatar_url = nullif(trim(p_avatar_url), '')
  where id = auth.uid();
end;
$$;

grant execute on function public.update_own_avatar(text) to authenticated;

-- 2) Public storage bucket for profile pictures.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- NOTE: storage.objects already has RLS enabled in every Supabase project;
-- do NOT run `alter table storage.objects enable row level security` here:
-- the dashboard role does not own that table (42501) and the whole
-- migration would roll back. CREATE POLICY below works as-is.

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars owner upload" on storage.objects;
create policy "avatars owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) Daily rollup table (mirrors profile_monthly_seconds).
create table if not exists public.profile_daily_seconds (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day text not null check (day ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  seconds integer not null default 0 check (seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.profile_daily_seconds enable row level security;

drop policy if exists "admin read daily seconds" on public.profile_daily_seconds;
create policy "admin read daily seconds"
  on public.profile_daily_seconds for select
  using (public.is_super_admin());

create index if not exists profile_daily_seconds_day_idx
  on public.profile_daily_seconds (day, seconds desc);

-- 4) Heartbeat: same capped delta as before, now also accumulated daily.
create or replace function public.heartbeat()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  delta integer := 0;
  m text;
  d text;
begin
  select case
      when last_seen is null then 0
      else least(greatest(extract(epoch from (now() - last_seen))::integer, 0), 120)
    end
    into delta
    from public.profiles
    where id = auth.uid();

  delta := coalesce(delta, 0);

  update public.profiles
  set total_seconds = total_seconds + delta,
      first_seen = coalesce(first_seen, now()),
      last_seen = now()
  where id = auth.uid();

  -- Daily + monthly rollups: only when a profile row exists and time passed.
  if delta > 0 and exists (select 1 from public.profiles where id = auth.uid()) then
    m := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM');
    d := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM-DD');
    insert into public.profile_monthly_seconds (user_id, month, seconds)
    values (auth.uid(), m, delta)
    on conflict (user_id, month)
    do update set seconds = profile_monthly_seconds.seconds + excluded.seconds,
                  updated_at = now();
    insert into public.profile_daily_seconds (user_id, day, seconds)
    values (auth.uid(), d, delta)
    on conflict (user_id, day)
    do update set seconds = profile_daily_seconds.seconds + excluded.seconds,
                  updated_at = now();
  end if;
end;
$$;

grant execute on function public.heartbeat() to authenticated;

-- 5) Leaderboard read: names + seconds + avatar only. The return type gains
--    avatar_url, so the previous version must be dropped before re-creating.
drop function if exists public.get_leaderboard(text, integer);

create function public.get_leaderboard(p_period text, p_limit integer default 10)
returns table (display_name text, seconds integer, is_you boolean, avatar_url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  m text;
  d0 text;
  d6 text;
  lim integer;
begin
  -- Only approved users may see the board.
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  ) then
    return;
  end if;

  lim := least(greatest(coalesce(p_limit, 10), 1), 50);

  if p_period = 'day' then
    d0 := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM-DD');
    return query
      select p.name, ds.seconds, (p.id = auth.uid()), p.avatar_url
      from public.profile_daily_seconds ds
      join public.profiles p on p.id = ds.user_id
      where ds.day = d0
        and ds.seconds > 0
        and p.status = 'approved'
        and p.role = 'student'
        and p.whatsapp not in ('01900000000', '01900000001')
      order by ds.seconds desc, p.name asc
      limit lim;
  elsif p_period = 'week' then
    d0 := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM-DD');
    d6 := to_char((now() at time zone 'Asia/Dhaka') - interval '6 days', 'YYYY-MM-DD');
    return query
      select p.name, sum(ds.seconds)::integer, (p.id = auth.uid()), p.avatar_url
      from public.profile_daily_seconds ds
      join public.profiles p on p.id = ds.user_id
      where ds.day >= d6
        and ds.day <= d0
        and p.status = 'approved'
        and p.role = 'student'
        and p.whatsapp not in ('01900000000', '01900000001')
      group by p.id, p.name, p.avatar_url
      having sum(ds.seconds) > 0
      order by sum(ds.seconds) desc, p.name asc
      limit lim;
  elsif p_period = 'month' then
    m := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM');
    return query
      select p.name, ms.seconds, (p.id = auth.uid()), p.avatar_url
      from public.profile_monthly_seconds ms
      join public.profiles p on p.id = ms.user_id
      where ms.month = m
        and ms.seconds > 0
        and p.status = 'approved'
        and p.role = 'student'
        and p.whatsapp not in ('01900000000', '01900000001')
      order by ms.seconds desc, p.name asc
      limit lim;
  else
    return query
      select p.name, coalesce(p.total_seconds, 0), (p.id = auth.uid()), p.avatar_url
      from public.profiles p
      where coalesce(p.total_seconds, 0) > 0
        and p.status = 'approved'
        and p.role = 'student'
        and p.whatsapp not in ('01900000000', '01900000001')
      order by coalesce(p.total_seconds, 0) desc, p.name asc
      limit lim;
  end if;
end;
$$;

grant execute on function public.get_leaderboard(text, integer) to authenticated;
