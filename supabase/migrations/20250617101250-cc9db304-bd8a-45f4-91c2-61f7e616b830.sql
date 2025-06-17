
-- Create conversation analytics table
CREATE TABLE public.conversation_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  seeker_id UUID,
  conversation_id UUID,
  total_messages INTEGER DEFAULT 0,
  agent_messages INTEGER DEFAULT 0,
  seeker_messages INTEGER DEFAULT 0,
  avg_response_time_minutes NUMERIC DEFAULT 0,
  first_response_time_minutes NUMERIC,
  conversation_duration_minutes NUMERIC,
  engagement_score INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create engagement metrics table
CREATE TABLE public.engagement_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  seeker_id UUID,
  metric_type TEXT NOT NULL, -- 'message', 'call', 'email', 'property_view', 'appointment_book'
  metric_value NUMERIC DEFAULT 1,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversion tracking table
CREATE TABLE public.conversion_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  seeker_id UUID,
  conversion_stage TEXT NOT NULL, -- 'lead', 'qualified', 'appointment', 'viewing', 'offer', 'deal'
  conversion_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deal_id UUID,
  property_id UUID,
  conversion_value NUMERIC,
  time_to_conversion_hours NUMERIC,
  previous_stage TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create success metrics summary table
CREATE TABLE public.success_metrics_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  avg_response_time_minutes NUMERIC DEFAULT 0,
  total_engagements INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  total_deal_value NUMERIC DEFAULT 0,
  avg_deal_closure_time_days NUMERIC DEFAULT 0,
  top_performing_hours JSONB,
  engagement_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, period_start, period_end)
);

-- Add indexes for better performance
CREATE INDEX idx_conversation_analytics_agent_id ON public.conversation_analytics(agent_id);
CREATE INDEX idx_conversation_analytics_seeker_id ON public.conversation_analytics(seeker_id);
CREATE INDEX idx_engagement_metrics_agent_id ON public.engagement_metrics(agent_id);
CREATE INDEX idx_engagement_metrics_type_date ON public.engagement_metrics(metric_type, interaction_date);
CREATE INDEX idx_conversion_tracking_agent_id ON public.conversion_tracking(agent_id);
CREATE INDEX idx_conversion_tracking_stage ON public.conversion_tracking(conversion_stage);
CREATE INDEX idx_success_metrics_agent_period ON public.success_metrics_summary(agent_id, period_start, period_end);

-- Enable RLS
ALTER TABLE public.conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_metrics_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents to see their own data
CREATE POLICY "Agents can view their conversation analytics" 
  ON public.conversation_analytics 
  FOR SELECT 
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert their conversation analytics" 
  ON public.conversation_analytics 
  FOR INSERT 
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their conversation analytics" 
  ON public.conversation_analytics 
  FOR UPDATE 
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can view their engagement metrics" 
  ON public.engagement_metrics 
  FOR SELECT 
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert their engagement metrics" 
  ON public.engagement_metrics 
  FOR INSERT 
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can view their conversion tracking" 
  ON public.conversion_tracking 
  FOR SELECT 
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert their conversion tracking" 
  ON public.conversion_tracking 
  FOR INSERT 
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can view their success metrics" 
  ON public.success_metrics_summary 
  FOR SELECT 
  USING (agent_id = auth.uid());

-- Admins can view all data
CREATE POLICY "Admins can view all conversation analytics" 
  ON public.conversation_analytics 
  FOR ALL 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Admins can view all engagement metrics" 
  ON public.engagement_metrics 
  FOR ALL 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Admins can view all conversion tracking" 
  ON public.conversion_tracking 
  FOR ALL 
  USING (public.has_role('admin'::app_role));

CREATE POLICY "Admins can view all success metrics" 
  ON public.success_metrics_summary 
  FOR ALL 
  USING (public.has_role('admin'::app_role));

-- Function to calculate and update conversation analytics
CREATE OR REPLACE FUNCTION public.update_conversation_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_id_var UUID;
  seeker_id_var UUID;
  conversation_id_var UUID;
  response_time_minutes NUMERIC;
  last_message_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Determine agent and seeker from the conversation
  SELECT participant1_id, participant2_id INTO agent_id_var, seeker_id_var
  FROM public.conversations 
  WHERE id = NEW.conversation_id;
  
  -- Get the previous message timestamp for response time calculation
  SELECT created_at INTO last_message_time
  FROM public.messages 
  WHERE conversation_id = NEW.conversation_id 
    AND id != NEW.id 
    AND sender_id != NEW.sender_id
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- Calculate response time if there was a previous message
  IF last_message_time IS NOT NULL THEN
    response_time_minutes := EXTRACT(EPOCH FROM (NEW.created_at - last_message_time)) / 60;
  END IF;
  
  -- Update or insert conversation analytics
  INSERT INTO public.conversation_analytics (
    agent_id, seeker_id, conversation_id, total_messages, 
    agent_messages, seeker_messages, last_activity_at
  )
  VALUES (
    agent_id_var, seeker_id_var, NEW.conversation_id, 1,
    CASE WHEN NEW.sender_id = agent_id_var THEN 1 ELSE 0 END,
    CASE WHEN NEW.sender_id = seeker_id_var THEN 1 ELSE 0 END,
    NEW.created_at
  )
  ON CONFLICT (conversation_id) 
  DO UPDATE SET
    total_messages = conversation_analytics.total_messages + 1,
    agent_messages = CASE 
      WHEN NEW.sender_id = agent_id_var 
      THEN conversation_analytics.agent_messages + 1 
      ELSE conversation_analytics.agent_messages 
    END,
    seeker_messages = CASE 
      WHEN NEW.sender_id = seeker_id_var 
      THEN conversation_analytics.seeker_messages + 1 
      ELSE conversation_analytics.seeker_messages 
    END,
    avg_response_time_minutes = CASE 
      WHEN response_time_minutes IS NOT NULL 
      THEN (COALESCE(conversation_analytics.avg_response_time_minutes, 0) + response_time_minutes) / 2
      ELSE conversation_analytics.avg_response_time_minutes
    END,
    first_response_time_minutes = CASE 
      WHEN conversation_analytics.first_response_time_minutes IS NULL AND response_time_minutes IS NOT NULL
      THEN response_time_minutes
      ELSE conversation_analytics.first_response_time_minutes
    END,
    last_activity_at = NEW.created_at,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Create trigger for conversation analytics
CREATE TRIGGER trigger_update_conversation_analytics
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_analytics();

-- Function to track engagement metrics
CREATE OR REPLACE FUNCTION public.track_engagement_metric(
  p_agent_id UUID,
  p_seeker_id UUID,
  p_metric_type TEXT,
  p_metric_value NUMERIC DEFAULT 1,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.engagement_metrics (
    agent_id, seeker_id, metric_type, metric_value, metadata
  )
  VALUES (p_agent_id, p_seeker_id, p_metric_type, p_metric_value, p_metadata);
END;
$$;

-- Function to track conversion stages
CREATE OR REPLACE FUNCTION public.track_conversion(
  p_agent_id UUID,
  p_seeker_id UUID,
  p_conversion_stage TEXT,
  p_deal_id UUID DEFAULT NULL,
  p_property_id UUID DEFAULT NULL,
  p_conversion_value NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  previous_stage_record RECORD;
  time_diff_hours NUMERIC;
BEGIN
  -- Get the previous conversion stage
  SELECT conversion_stage, conversion_date INTO previous_stage_record
  FROM public.conversion_tracking
  WHERE agent_id = p_agent_id AND seeker_id = p_seeker_id
  ORDER BY conversion_date DESC
  LIMIT 1;
  
  -- Calculate time to conversion
  IF previous_stage_record.conversion_date IS NOT NULL THEN
    time_diff_hours := EXTRACT(EPOCH FROM (now() - previous_stage_record.conversion_date)) / 3600;
  END IF;
  
  INSERT INTO public.conversion_tracking (
    agent_id, seeker_id, conversion_stage, deal_id, property_id,
    conversion_value, time_to_conversion_hours, previous_stage
  )
  VALUES (
    p_agent_id, p_seeker_id, p_conversion_stage, p_deal_id, p_property_id,
    p_conversion_value, time_diff_hours, previous_stage_record.conversion_stage
  );
END;
$$;
