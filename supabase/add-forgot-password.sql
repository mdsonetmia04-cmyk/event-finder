-- Sweet Smart Calendar — Forgot password, migration v25
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- reset_password_by_whatsapp(p_whatsapp): for the login screen's
-- "Forgot password?" flow. Passwords live in Supabase Auth (GoTrue), not in
-- public.profiles: login signs in with the synthetic email
-- <whatsapp>@sweet-smart-calendar.app and the bcrypt hash stored in
-- auth.users.encrypted_password. So the reset must rewrite that hash.
--
-- Behavior:
--   * Normalizes the number (trim, strip spaces/dashes, +880/880 -> 0) and
--     requires the 01[3-9]XXXXXXXX form login accepts.
--   * Only acts when a profile with that number has status = 'approved'.
--     Unknown, pending, and rejected numbers return NULL and nothing changes.
--   * Generates an unpredictable 6-digit code (100000-999999) from
--     pgcrypto's gen_random_bytes, stores crypt(code, gen_salt('bf')) as
--     the account's new password, and returns the code as text. The code IS
--     the new password going forward; the UI shows it on screen.
--   * Never changes status, role, or any other row; touches only the one
--     matching auth.users row (encrypted_password + updated_at).
--
-- SECURITY DEFINER + grant to anon: logged-out users call this from the
-- login screen. It reveals nothing except the code for an approved
-- account — which is the feature the owner ordered.
--
-- Verification (run after; expect one row):
--   select proname from pg_proc where proname = 'reset_password_by_whatsapp';

create extension if not exists pgcrypto;

create or replace function public.reset_password_by_whatsapp(p_whatsapp text)
returns text
language plpgsql
security definer
-- pgcrypto lives in extensions on current Supabase projects, in public on
-- older ones; both schemas on the path keeps crypt/gen_salt/gen_random_bytes
-- resolvable either way. All table references below are schema-qualified.
set search_path = public, extensions
as $$
declare
  v_wa text;
  v_user_id uuid;
  v_bytes bytea;
  v_code text;
begin
  -- Normalize exactly like the app's forgot-password input: trim, strip
  -- spaces/dashes, convert +880/880 prefixes to the stored 01... form.
  v_wa := regexp_replace(coalesce(trim(p_whatsapp), ''), '[\s-]', '', 'g');
  if v_wa like '+880%' then
    v_wa := '0' || substr(v_wa, 5);
  elsif v_wa like '880%' then
    v_wa := '0' || substr(v_wa, 4);
  end if;
  if v_wa !~ '^01[3-9][0-9]{8}$' then
    return null;
  end if;

  select id into v_user_id
  from public.profiles
  where whatsapp = v_wa and status = 'approved'
  limit 1;
  if v_user_id is null then
    return null;
  end if;

  -- Unpredictable 6-digit code from 3 CSPRNG bytes (24 bits; plain int
  -- arithmetic, no overflow). The modulo step has a negligible bias
  -- (2^24 is not a multiple of 900000); unpredictability, not perfect
  -- uniformity, is what matters here.
  v_bytes := gen_random_bytes(3);
  v_code := ((get_byte(v_bytes, 0) * 65536
            + get_byte(v_bytes, 1) * 256
            + get_byte(v_bytes, 2)) % 900000 + 100000)::text;

  update auth.users
  set encrypted_password = crypt(v_code, gen_salt('bf')),
      updated_at = now()
  where id = v_user_id;

  return v_code;
end;
$$;

grant execute on function public.reset_password_by_whatsapp(text) to anon, authenticated;
