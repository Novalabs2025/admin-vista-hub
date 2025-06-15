
-- First, let's check and update the has_role function to work with our app_role enum
CREATE OR REPLACE FUNCTION public.has_role(role_to_check app_role)
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

-- Now create the analytics tables with the corrected policies
CREATE TABLE public.analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_properties INTEGER DEFAULT 0,
  new_properties INTEGER DEFAULT 0,
  total_agents INTEGER DEFAULT 0,
  new_agents INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  new_leads INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  avg_property_price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date)
);

-- Create agent performance metrics table
CREATE TABLE public.agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  date DATE NOT NULL,
  properties_listed INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue_generated NUMERIC DEFAULT 0,
  avg_response_time INTEGER DEFAULT 0,
  satisfaction_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id, date)
);

-- Create property market trends table
CREATE TABLE public.market_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  property_type TEXT NOT NULL,
  date DATE NOT NULL,
  avg_price NUMERIC DEFAULT 0,
  price_change_percentage NUMERIC DEFAULT 0,
  total_listings INTEGER DEFAULT 0,
  days_on_market INTEGER DEFAULT 0,
  demand_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(location, property_type, date)
);

-- Create revenue analytics table
CREATE TABLE public.revenue_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  subscription_revenue NUMERIC DEFAULT 0,
  commission_revenue NUMERIC DEFAULT 0,
  other_revenue NUMERIC DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  new_subscribers INTEGER DEFAULT 0,
  churned_subscribers INTEGER DEFAULT 0,
  active_subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date)
);

-- Add indexes for better query performance
CREATE INDEX idx_analytics_daily_date ON public.analytics_daily(date);
CREATE INDEX idx_agent_performance_agent_date ON public.agent_performance_metrics(agent_id, date);
CREATE INDEX idx_market_trends_location_type_date ON public.market_trends(location, property_type, date);
CREATE INDEX idx_revenue_analytics_date ON public.revenue_analytics(date);

-- Enable RLS
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only (using the correct enum type)
CREATE POLICY "Only admins can access analytics_daily" ON public.analytics_daily
  FOR ALL USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can access agent_performance_metrics" ON public.agent_performance_metrics
  FOR ALL USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can access market_trends" ON public.market_trends
  FOR ALL USING (public.has_role('admin'::app_role));

CREATE POLICY "Only admins can access revenue_analytics" ON public.revenue_analytics
  FOR ALL USING (public.has_role('admin'::app_role));

-- Create function to aggregate daily analytics
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.analytics_daily (
    date,
    total_properties,
    new_properties,
    total_agents,
    new_agents,
    total_leads,
    new_leads,
    total_revenue,
    avg_property_price
  )
  SELECT
    target_date,
    (SELECT COUNT(*) FROM public.properties WHERE created_at::date <= target_date),
    (SELECT COUNT(*) FROM public.properties WHERE created_at::date = target_date),
    (SELECT COUNT(*) FROM public.agent_verifications WHERE status = 'approved' AND created_at::date <= target_date),
    (SELECT COUNT(*) FROM public.agent_verifications WHERE status = 'approved' AND created_at::date = target_date),
    (SELECT COUNT(*) FROM public.leads WHERE created_at::date <= target_date),
    (SELECT COUNT(*) FROM public.leads WHERE created_at::date = target_date),
    (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE status = 'Paid' AND created_at::date <= target_date),
    (SELECT COALESCE(AVG(price), 0) FROM public.properties WHERE created_at::date <= target_date)
  ON CONFLICT (date) 
  DO UPDATE SET
    total_properties = EXCLUDED.total_properties,
    new_properties = EXCLUDED.new_properties,
    total_agents = EXCLUDED.total_agents,
    new_agents = EXCLUDED.new_agents,
    total_leads = EXCLUDED.total_leads,
    new_leads = EXCLUDED.new_leads,
    total_revenue = EXCLUDED.total_revenue,
    avg_property_price = EXCLUDED.avg_property_price;
END;
$$;
