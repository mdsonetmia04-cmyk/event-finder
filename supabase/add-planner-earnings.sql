-- Sweet Smart Calendar — asset planner earnings migration v8
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- planner_earnings: per-student, per-account, per-date earnings records shown
-- inside the Asset Planner ("date onujayi earning").
--   account: 'non_ai' (Account 1 — Non AI), 'ai' (Account 2 — AI),
--            'icons' (Account 3 — Icons)
--   entry_date: the date the row belongs to
--   approved_assets: total approved assets as of that date
--   earning: earning figure for that date
-- One row per (user, account, date) — the UI upserts, so the newest entry for
-- an account is the "last updated" state.
--
-- RLS: a student reads/writes ONLY their own rows; the super admin can read
-- everyone's rows (student name click-through in the planner).

create table if not exists public.planner_earnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account text not null check (account in ('non_ai', 'ai', 'icons')),
  entry_date date not null,
  approved_assets integer not null default 0 check (approved_assets >= 0),
  earning numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, account, entry_date)
);

alter table public.planner_earnings enable row level security;

drop policy if exists "own earnings read" on public.planner_earnings;
create policy "own earnings read"
  on public.planner_earnings for select
  to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

drop policy if exists "own earnings insert" on public.planner_earnings;
create policy "own earnings insert"
  on public.planner_earnings for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "own earnings update" on public.planner_earnings;
create policy "own earnings update"
  on public.planner_earnings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own earnings delete" on public.planner_earnings;
create policy "own earnings delete"
  on public.planner_earnings for delete
  to authenticated
  using (user_id = auth.uid());

create index if not exists planner_earnings_user_idx
  on public.planner_earnings (user_id, account, entry_date desc);
