
-- First, let's see what values are allowed in the app_role enum
SELECT unnest(enum_range(NULL::app_role)) AS role_values;

-- Add role column to profiles table with a valid default value
-- Based on the user_roles table structure, let's use a valid enum value
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'admin';

-- Add foreign key constraint for realtime_messages.sender_id -> profiles.id
-- First check if the constraint doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'realtime_messages_sender_id_fkey' 
        AND table_name = 'realtime_messages'
    ) THEN
        ALTER TABLE public.realtime_messages 
        ADD CONSTRAINT realtime_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
