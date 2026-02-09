-- Script to add a user as admin
-- Replace 'user@example.com' with the actual email of the user you want to make admin

-- Method 1: Update existing user by email
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'user@example.com';

-- Method 2: Update existing user by user ID (if you know the UUID)
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE id = 'USER_UUID_HERE';

-- Method 3: Insert admin profile directly (if user exists in auth.users but not in profiles)
-- INSERT INTO public.profiles (id, email, role)
-- SELECT id, email, 'admin'
-- FROM auth.users 
-- WHERE email = 'user@example.com'
-- AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.users.id);

-- Verify the admin was added
SELECT id, email, role, created_at 
FROM public.profiles 
WHERE role = 'admin';

-- Check if the user is recognized as admin using the is_admin() function
-- Note: This will only work when executed as the target user
-- SELECT public.is_admin();
