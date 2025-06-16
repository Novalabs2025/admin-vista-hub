
-- First, let's create the has_role function if it doesn't exist with the correct signature
CREATE OR REPLACE FUNCTION public.has_role(role_to_check public.app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid() AND role = role_to_check
  );
END;
$$;

-- Create enum for message types
CREATE TYPE public.message_type AS ENUM ('chat', 'broadcast', 'emergency', 'announcement');

-- Create enum for broadcast types  
CREATE TYPE public.broadcast_type AS ENUM ('system_announcement', 'emergency_alert', 'general_broadcast');

-- Create real-time messages table
CREATE TABLE public.realtime_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for broadcasts
  message_type message_type NOT NULL DEFAULT 'chat',
  broadcast_type broadcast_type, -- Only for broadcast messages
  title TEXT, -- For announcements/alerts
  content TEXT NOT NULL,
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB, -- For additional data like attachments, priorities, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_realtime_messages_recipient ON public.realtime_messages(recipient_id);
CREATE INDEX idx_realtime_messages_type ON public.realtime_messages(message_type);
CREATE INDEX idx_realtime_messages_created_at ON public.realtime_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.realtime_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see messages sent to them or broadcast messages
CREATE POLICY "Users can view their messages and broadcasts" 
  ON public.realtime_messages 
  FOR SELECT 
  USING (
    recipient_id = auth.uid() OR 
    recipient_id IS NULL OR 
    sender_id = auth.uid()
  );

-- Users can send messages
CREATE POLICY "Users can send messages" 
  ON public.realtime_messages 
  FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- Users can update their own messages (mark as read, etc.)
CREATE POLICY "Users can update their messages" 
  ON public.realtime_messages 
  FOR UPDATE 
  USING (recipient_id = auth.uid() OR sender_id = auth.uid());

-- Only admins can send broadcasts and emergency alerts
CREATE POLICY "Admins can send broadcasts" 
  ON public.realtime_messages 
  FOR INSERT 
  WITH CHECK (
    (message_type IN ('broadcast', 'emergency', 'announcement') AND public.has_role('admin'::public.app_role)) OR
    message_type = 'chat'
  );

-- Enable realtime for the table
ALTER TABLE public.realtime_messages REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.realtime_messages;

-- Create function to automatically mark messages as read when viewed
CREATE OR REPLACE FUNCTION public.mark_message_as_read(message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.realtime_messages 
  SET is_read = true, updated_at = now()
  WHERE id = message_id AND recipient_id = auth.uid();
END;
$$;

-- Create function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.realtime_messages
    WHERE recipient_id = auth.uid() AND is_read = false
  );
END;
$$;
