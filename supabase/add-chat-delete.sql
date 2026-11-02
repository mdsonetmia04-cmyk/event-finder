-- Sweet Smart Calendar — chat delete support (migration v6)
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Lets students delete their own messages. (The super admin can already
-- delete everything via the "super admin all messages" ALL policy.)

drop policy if exists "user delete own messages" on public.admin_messages;
create policy "user delete own messages"
  on public.admin_messages for delete
  using (auth.uid() = user_id);
