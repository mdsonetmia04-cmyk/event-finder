-- Sweet Smart Calendar — Game Chat own-message delete migration v17
-- Run ONCE in the Supabase Dashboard: SQL Editor → New query → paste → Run.
-- It is idempotent: safe to run again.
--
-- Every user can delete their OWN Game Chat messages (owner order): a
-- trash button beside each own message removes it immediately. Nobody
-- can delete anyone else's message — the policy below allows a delete
-- only when the row's author is the caller. Read receipts need no
-- extra cleanup: zone_chat_reads references zone_chat_messages with
-- ON DELETE CASCADE, so a deleted message's receipts vanish with it.
--
-- This migration adds one policy plus the matching table privilege:
-- migration v13 granted select + insert only, and a delete call fails
-- before RLS is even evaluated without the delete privilege. No
-- function changes, no other RLS changes. It never touches
-- storage.objects.

drop policy if exists "zone_chat_messages_delete_own" on public.zone_chat_messages;
create policy "zone_chat_messages_delete_own"
  on public.zone_chat_messages for delete
  using (auth.uid() = user_id);

grant delete on public.zone_chat_messages to authenticated;
