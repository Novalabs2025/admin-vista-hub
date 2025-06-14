
-- Enable Row Level Security for relevant tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies to allow authenticated users to read data
CREATE POLICY "Allow authenticated users to read properties" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read agent verifications" ON public.agent_verifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read leads" ON public.leads FOR SELECT TO authenticated USING (true);

-- Enable realtime updates by setting REPLICA IDENTITY
ALTER TABLE public.properties REPLICA IDENTITY FULL;
ALTER TABLE public.agent_verifications REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR TABLE public.properties, public.agent_verifications, public.leads;
  ELSE
    ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_verifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
END;
$$;
