
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;

-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Create a function to check if user has admin or super_admin role
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- Create admin invitations table
CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  role app_role NOT NULL DEFAULT 'admin',
  invitation_token TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_invitations
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_invitations
CREATE POLICY "Super admins can manage invitations" ON public.admin_invitations
FOR ALL USING (public.is_super_admin());

-- Update agent_verifications RLS policies
DROP POLICY IF EXISTS "Admins can manage agent verifications" ON public.agent_verifications;
CREATE POLICY "Admins can manage agent verifications" ON public.agent_verifications
FOR ALL USING (public.is_admin_or_super());

-- Create new user_roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all user roles" ON public.user_roles
FOR ALL USING (public.is_super_admin());
