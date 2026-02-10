-- Fix duplicate profiles for thecoastalwarehouse@gmail.com
-- Keep the most recent profile (created 2026-02-09) and remove the older one

-- First, let's see which auth.user these profiles belong to
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  p.id as profile_id,
  p.role,
  p.full_name,
  p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'thecoastalwarehouse@gmail.com'
ORDER BY p.created_at DESC;

-- Remove the older duplicate profile (from 2025-12-24)
-- Keep the newest one (from 2026-02-09)
DELETE FROM public.profiles 
WHERE email = 'thecoastalwarehouse@gmail.com' 
AND created_at = '2025-12-24 18:30:36.273578+00';

-- Verify the fix
SELECT 
  p.id,
  p.email,
  p.role,
  p.full_name,
  p.created_at
FROM public.profiles p
WHERE p.email = 'thecoastalwarehouse@gmail.com';
