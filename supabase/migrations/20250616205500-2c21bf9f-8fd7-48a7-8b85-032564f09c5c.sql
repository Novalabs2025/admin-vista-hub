
-- Add new property status values to handle rented, sold, leased states
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'rented';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'sold';
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'leased';

-- Add a column to track status change history and reasons
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS status_change_reason text;

-- Create a function to log status changes
CREATE OR REPLACE FUNCTION log_property_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = COALESCE(OLD.status_history, '[]'::jsonb) || 
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status,
        'changed_at', now(),
        'changed_by', auth.uid(),
        'reason', NEW.status_change_reason
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log status changes
DROP TRIGGER IF EXISTS property_status_change_log ON public.properties;
CREATE TRIGGER property_status_change_log
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION log_property_status_change();
