
-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  seeker_id UUID,
  seeker_name TEXT NOT NULL,
  seeker_email TEXT,
  seeker_phone TEXT,
  property_id UUID,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'property_viewing', -- property_viewing, consultation, follow_up
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show
  notes TEXT,
  location TEXT,
  duration_minutes INTEGER DEFAULT 60,
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deals table for tracking agent-seeker interactions and conversions
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  seeker_id UUID,
  seeker_name TEXT NOT NULL,
  seeker_email TEXT,
  seeker_phone TEXT,
  property_id UUID,
  deal_value NUMERIC,
  commission_amount NUMERIC,
  stage TEXT NOT NULL DEFAULT 'lead', -- lead, qualified, proposal, negotiation, closed_won, closed_lost
  probability INTEGER DEFAULT 0, -- 0-100 percentage
  expected_close_date DATE,
  actual_close_date DATE,
  source TEXT, -- whatsapp, website, referral, etc
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create interaction tracking table
CREATE TABLE public.agent_seeker_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  seeker_id UUID,
  seeker_name TEXT NOT NULL,
  seeker_contact TEXT, -- phone/email
  deal_id UUID,
  appointment_id UUID,
  interaction_type TEXT NOT NULL, -- call, whatsapp, email, meeting, property_view
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_minutes INTEGER,
  outcome TEXT, -- interested, not_interested, follow_up_needed, appointment_scheduled, deal_closed
  notes TEXT,
  attachments JSONB, -- for storing file URLs, voice recordings, etc
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create auto reminders table
CREATE TABLE public.auto_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- email, sms, whatsapp
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  message_template TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.appointments ADD CONSTRAINT fk_appointments_property 
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE public.deals ADD CONSTRAINT fk_deals_property 
  FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE SET NULL;

ALTER TABLE public.agent_seeker_interactions ADD CONSTRAINT fk_interactions_deal 
  FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL;

ALTER TABLE public.agent_seeker_interactions ADD CONSTRAINT fk_interactions_appointment 
  FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;

ALTER TABLE public.auto_reminders ADD CONSTRAINT fk_reminders_appointment 
  FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_seeker_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
CREATE POLICY "Agents can manage their own appointments" ON public.appointments
  FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Create RLS policies for deals
CREATE POLICY "Agents can manage their own deals" ON public.deals
  FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all deals" ON public.deals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Create RLS policies for interactions
CREATE POLICY "Agents can manage their own interactions" ON public.agent_seeker_interactions
  FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all interactions" ON public.agent_seeker_interactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Create RLS policies for reminders
CREATE POLICY "Agents can manage reminders for their appointments" ON public.auto_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.appointments WHERE id = appointment_id AND agent_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX idx_appointments_agent_date ON public.appointments(agent_id, appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_deals_agent_stage ON public.deals(agent_id, stage);
CREATE INDEX idx_interactions_agent_date ON public.agent_seeker_interactions(agent_id, interaction_date);
CREATE INDEX idx_reminders_time ON public.auto_reminders(reminder_time, sent);

-- Create function to automatically create deal when appointment is completed
CREATE OR REPLACE FUNCTION public.create_deal_from_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- When appointment status changes to completed, create a deal if it doesn't exist
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.deals (
      agent_id, 
      seeker_name, 
      seeker_email, 
      seeker_phone, 
      property_id,
      stage,
      source,
      notes
    )
    VALUES (
      NEW.agent_id,
      NEW.seeker_name,
      NEW.seeker_email,
      NEW.seeker_phone,
      NEW.property_id,
      'qualified',
      'appointment',
      'Deal created from completed appointment: ' || NEW.id
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic deal creation
CREATE TRIGGER trigger_create_deal_from_appointment
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_deal_from_appointment();

-- Create function to schedule automatic reminders
CREATE OR REPLACE FUNCTION public.schedule_appointment_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule reminder 24 hours before appointment
  INSERT INTO public.auto_reminders (
    appointment_id,
    reminder_type,
    reminder_time,
    message_template
  )
  VALUES (
    NEW.id,
    'email',
    NEW.appointment_date - INTERVAL '24 hours',
    'Reminder: You have an appointment scheduled for tomorrow at ' || to_char(NEW.appointment_date, 'HH24:MI on DD/MM/YYYY')
  );
  
  -- Schedule reminder 2 hours before appointment
  INSERT INTO public.auto_reminders (
    appointment_id,
    reminder_type,
    reminder_time,
    message_template
  )
  VALUES (
    NEW.id,
    'sms',
    NEW.appointment_date - INTERVAL '2 hours',
    'Reminder: Your appointment is in 2 hours at ' || to_char(NEW.appointment_date, 'HH24:MI')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reminder scheduling
CREATE TRIGGER trigger_schedule_reminders
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.schedule_appointment_reminders();
