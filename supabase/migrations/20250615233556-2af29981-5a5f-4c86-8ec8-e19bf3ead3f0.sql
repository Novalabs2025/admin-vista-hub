
-- Add admin role to the current user (HABU SULEIMAN)
INSERT INTO public.user_roles (user_id, role) 
VALUES ('db04ebde-0d88-45a0-90da-f710927ba003', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
