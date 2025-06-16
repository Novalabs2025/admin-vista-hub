
-- Improve image duplicate detection with better hash algorithm support
ALTER TABLE public.property_image_hashes 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS hash_algorithm text DEFAULT 'md5',
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS similarity_score numeric DEFAULT 1.0;

-- Create index for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_property_image_hashes_hash ON public.property_image_hashes(image_hash);
CREATE INDEX IF NOT EXISTS idx_property_image_hashes_agent ON public.property_image_hashes(agent_id);

-- Add RLS policies for property image hashes
ALTER TABLE public.property_image_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own image hashes" ON public.property_image_hashes
FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert their own image hashes" ON public.property_image_hashes
FOR INSERT WITH CHECK (agent_id = auth.uid());

-- Allow agents to update property status to sold/rented/leased
CREATE POLICY "Agents can update their own property status" ON public.properties
FOR UPDATE USING (agent_id = auth.uid())
WITH CHECK (
  agent_id = auth.uid() AND 
  status IN ('approved', 'rented', 'sold', 'leased', 'pending')
);

-- Create a function to detect image duplicates
CREATE OR REPLACE FUNCTION detect_image_duplicates(
  p_image_hash text,
  p_agent_id uuid,
  p_similarity_threshold numeric DEFAULT 0.95
)
RETURNS TABLE(
  property_id uuid,
  agent_id uuid,
  image_hash text,
  similarity_score numeric,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pih.property_id,
    pih.agent_id,
    pih.image_hash,
    pih.similarity_score,
    pih.created_at
  FROM public.property_image_hashes pih
  WHERE pih.image_hash = p_image_hash
    AND pih.agent_id != p_agent_id
    AND pih.similarity_score >= p_similarity_threshold
  ORDER BY pih.created_at DESC;
END;
$$;
