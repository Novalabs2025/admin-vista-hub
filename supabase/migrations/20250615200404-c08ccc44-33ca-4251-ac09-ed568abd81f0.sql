
-- Create an enum type for payment status
CREATE TYPE public.payment_status AS ENUM ('Paid', 'Pending', 'Failed');

-- Create the payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'Pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all payments
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.has_role('admin'));

-- Policy for users to view their own payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);


-- Create an enum for notification type
CREATE TYPE public.notification_type AS ENUM ('new_agent_pending_approval', 'system_update', 'agent_rejected', 'property_approved', 'property_rejected', 'property_submitted');

-- Create the notifications table
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    read boolean NOT NULL DEFAULT false,
    type public.notification_type NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- The user that this notification is about
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row-Level Security on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can see all notifications.
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (public.has_role('admin'));

-- RLS: Admins can update notifications (e.g. mark as read)
CREATE POLICY "Admins can update notifications" ON public.notifications FOR UPDATE USING (public.has_role('admin')) WITH CHECK (public.has_role('admin'));

