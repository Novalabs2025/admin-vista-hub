
-- Create WhatsApp voice messages table
CREATE TABLE public.whatsapp_voice_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_sid TEXT UNIQUE NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  media_url TEXT,
  media_content_type TEXT,
  voice_file_path TEXT,
  transcription TEXT,
  transcription_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  response_text TEXT,
  response_audio_path TEXT,
  response_sent BOOLEAN DEFAULT FALSE,
  agent_id UUID,
  seeker_id UUID,
  conversation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audio files table for management
CREATE TABLE public.audio_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  duration_seconds NUMERIC,
  file_type TEXT NOT NULL, -- 'voice_message', 'response_audio'
  content_type TEXT,
  related_message_id UUID REFERENCES public.whatsapp_voice_messages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_whatsapp_voice_messages_from_number ON public.whatsapp_voice_messages(from_number);
CREATE INDEX idx_whatsapp_voice_messages_agent_id ON public.whatsapp_voice_messages(agent_id);
CREATE INDEX idx_whatsapp_voice_messages_created_at ON public.whatsapp_voice_messages(created_at);
CREATE INDEX idx_audio_files_related_message ON public.audio_files(related_message_id);

-- Enable RLS
ALTER TABLE public.whatsapp_voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents can view their voice messages" 
  ON public.whatsapp_voice_messages 
  FOR SELECT 
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can update their voice messages" 
  ON public.whatsapp_voice_messages 
  FOR UPDATE 
  USING (agent_id = auth.uid());

CREATE POLICY "System can insert voice messages" 
  ON public.whatsapp_voice_messages 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Agents can view their audio files" 
  ON public.audio_files 
  FOR SELECT 
  USING (
    related_message_id IN (
      SELECT id FROM public.whatsapp_voice_messages WHERE agent_id = auth.uid()
    )
  );

CREATE POLICY "System can manage audio files" 
  ON public.audio_files 
  FOR ALL 
  WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view all voice messages" 
  ON public.whatsapp_voice_messages 
  FOR ALL 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Admins can view all audio files" 
  ON public.audio_files 
  FOR ALL 
  USING (public.has_role('admin'::app_role));
