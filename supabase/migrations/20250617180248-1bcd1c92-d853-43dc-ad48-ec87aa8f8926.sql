
-- First, let's see the current user roles to understand what we're working with
SELECT ur.user_id, ur.role, p.full_name, au.email 
FROM public.user_roles ur
LEFT JOIN public.profiles p ON ur.user_id = p.id
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role IN ('admin', 'super_admin');

-- Remove super_admin role from current super admin (HABU SULEIMAN)
DELETE FROM public.user_roles 
WHERE user_id = 'db04ebde-0d88-45a0-90da-f710927ba003' 
AND role = 'super_admin';

-- Add regular admin role to the current super admin if not already present
INSERT INTO public.user_roles (user_id, role) 
VALUES ('db04ebde-0d88-45a0-90da-f710927ba003', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- To create a new super admin, you'll need to replace 'NEW_USER_ID_HERE' 
-- with the actual user ID of the person you want to make super admin
-- You can get this ID from the auth.users table or when they sign up

-- Example (replace with actual user ID):
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('NEW_USER_ID_HERE', 'super_admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- If you want to see all users to find the ID of who should be super admin:
-- SELECT id, email, created_at, raw_user_meta_data->>'full_name' as full_name
-- FROM auth.users 
-- ORDER BY created_at DESC;
