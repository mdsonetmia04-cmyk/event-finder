-- Sweet Smart Calendar — Supabase schema
-- Run this ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.

-- 1) Profiles table: one row per registered user, linked to Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  whatsapp text not null unique,
  role text not null default 'student' check (role in ('super_admin', 'student')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 2) Helper: is the current user the super admin? (SECURITY DEFINER avoids RLS recursion)
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- 3) Helper: is a WhatsApp number already registered? (lets the app show
--    "already registered" without exposing the profiles table to anonymous users)
create or replace function public.whatsapp_registered(wa text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where whatsapp = wa);
$$;

grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.whatsapp_registered(text) to anon, authenticated;

-- 4) Row-level security policies
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "admin read all profiles" on public.profiles;
create policy "admin read all profiles"
  on public.profiles for select
  using (public.is_super_admin());

drop policy if exists "insert own pending profile" on public.profiles;
create policy "insert own pending profile"
  on public.profiles for insert
  with check (
    auth.uid() = id
    and role = 'student'
    and status = 'pending'
  );

drop policy if exists "admin update profiles" on public.profiles;
create policy "admin update profiles"
  on public.profiles for update
  using (public.is_super_admin());

drop policy if exists "admin delete profiles" on public.profiles;
create policy "admin delete profiles"
  on public.profiles for delete
  using (public.is_super_admin());
