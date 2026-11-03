-- Sweet Smart Calendar — public registered-count RPC migration v12
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Lets the public landing page show a LIVE "N learners already joined"
-- counter without exposing the profiles table to guests.

create or replace function public.registered_count()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.profiles where status = 'approved';
$$;

grant execute on function public.registered_count() to anon, authenticated;
