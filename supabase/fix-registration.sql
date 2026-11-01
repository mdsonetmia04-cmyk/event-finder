-- Fix 2026-11-01: full user removal for the admin panel.
-- The panel's "Remove" must delete the Supabase Auth user too; otherwise the
-- WhatsApp number can never register again (signUp would say "already
-- registered" forever). profiles.id has ON DELETE CASCADE, so removing the
-- auth user removes the profile row automatically.

create or replace function public.admin_delete_user(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
begin
  if not public.is_super_admin() then
    raise exception 'not authorized';
  end if;
  if target_id = auth.uid() then
    raise exception 'cannot delete your own account';
  end if;
  select role into target_role from public.profiles where id = target_id;
  if target_role = 'super_admin' then
    raise exception 'cannot delete a super admin';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
