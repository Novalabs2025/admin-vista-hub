
-- This command ensures that when a notification is updated or deleted,
-- the old data is available in the real-time event.
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- This command adds the notifications table to the list of tables
-- that Supabase will broadcast real-time changes for.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
