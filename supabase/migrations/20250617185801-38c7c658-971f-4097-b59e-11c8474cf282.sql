
-- Assign super_admin role to the user (the profile already exists)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('7f18b8eb-3387-4fe1-998a-8d5f84014dd6', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;
