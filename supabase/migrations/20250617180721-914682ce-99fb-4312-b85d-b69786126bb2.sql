
-- Create admin invitation for new super admin
INSERT INTO public.admin_invitations (
  email, 
  role, 
  invited_by
) 
VALUES (
  'settlesmartai@gmail.com', 
  'super_admin', 
  'db04ebde-0d88-45a0-90da-f710927ba003'
);

-- Verify the invitation was created
SELECT 
  email, 
  role, 
  invitation_token,
  expires_at,
  created_at
FROM public.admin_invitations 
WHERE email = 'settlesmartai@gmail.com';
