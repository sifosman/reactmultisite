-- Check if the user thecoastalwarehouse@gmail.com exists and their role
-- This script will help diagnose the login issue

-- First, let's see if the user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'thecoastalwarehouse@gmail.com';

-- Then check if they have a profile and what role they have
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  p.created_at
FROM public.profiles p
WHERE p.email = 'thecoastalwarehouse@gmail.com';

-- If the user exists but doesn't have admin role, we can update it
-- Uncomment the following lines if needed:

-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'thecoastalwarehouse@gmail.com';

-- Or if the user doesn't have a profile at all, we can create one
-- Uncomment the following lines if needed (you'll need the user ID from the first query):

-- INSERT INTO public.profiles (id, email, role)
-- VALUES ('USER_ID_HERE', 'thecoastalwarehouse@gmail.com', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
