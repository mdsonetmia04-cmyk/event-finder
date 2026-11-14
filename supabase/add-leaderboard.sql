-- Sweet Smart Calendar — leaderboard migration v9
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- 1) profile_monthly_seconds: per-user, per-month active seconds, built from
--    the same heartbeat delta as profiles.total_seconds. Month keys are
--    Asia/Dhaka calendar months ('YYYY-MM'), matching the site's clock.
--    The monthly board accumulates from the day this migration runs; the
--    all-time board uses the existing total_seconds immediately.
--
-- 2) heartbeat() is extended to upsert the current month's row with the
--    exact same capped delta it already adds to total_seconds. Behaviour
--    for total_seconds / first_seen / last_seen is unchanged.
--
-- 3) get_leaderboard(p_period, p_limit): SECURITY DEFINER read for the
--    dashboard leaderboard. Students can only read their own profile row
--    under RLS, so the board reads through this function. It returns ONLY
--    display names + seconds + an is_you flag — never WhatsApp numbers,
--    emails, or earnings. Only approved students appear; the super admin
--    is excluded. Pending/rejected callers get an empty set.

create table if not exists public.profile_monthly_seconds (
  user_id uuid not null references public.profiles(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  seconds integer not null default 0 check (seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.profile_monthly_seconds enable row level security;

drop policy if exists "admin read monthly seconds" on public.profile_monthly_seconds;
create policy "admin read monthly seconds"
  on public.profile_monthly_seconds for select
  using (public.is_super_admin());

create index if not exists profile_monthly_seconds_month_idx
  on public.profile_monthly_seconds (month, seconds desc);

-- Heartbeat: same capped delta as before, now also accumulated monthly.
create or replace function public.heartbeat()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  delta integer := 0;
  m text;
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

  -- Monthly rollup: only when a profile row exists and time actually passed.
  if delta > 0 and exists (select 1 from public.profiles where id = auth.uid()) then
    m := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM');
    insert into public.profile_monthly_seconds (user_id, month, seconds)
    values (auth.uid(), m, delta)
    on conflict (user_id, month)
    do update set seconds = profile_monthly_seconds.seconds + excluded.seconds,
                  updated_at = now();
  end if;
end;
$$;

grant execute on function public.heartbeat() to authenticated;

-- Leaderboard read: names + seconds only.
create or replace function public.get_leaderboard(p_period text, p_limit integer default 10)
returns table (display_name text, seconds integer, is_you boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  m text;
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

  if p_period = 'month' then
    m := to_char(now() at time zone 'Asia/Dhaka', 'YYYY-MM');
    return query
      select p.name, ms.seconds, (p.id = auth.uid())
      from public.profile_monthly_seconds ms
      join public.profiles p on p.id = ms.user_id
      where ms.month = m
        and ms.seconds > 0
        and p.status = 'approved'
        and p.role = 'student'
      order by ms.seconds desc, p.name asc
      limit lim;
  else
    return query
      select p.name, coalesce(p.total_seconds, 0), (p.id = auth.uid())
      from public.profiles p
      where coalesce(p.total_seconds, 0) > 0
        and p.status = 'approved'
        and p.role = 'student'
      order by coalesce(p.total_seconds, 0) desc, p.name asc
      limit lim;
  end if;
end;
$$;

grant execute on function public.get_leaderboard(text, integer) to authenticated;
