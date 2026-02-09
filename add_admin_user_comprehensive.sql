-- Comprehensive script to add a user as admin
-- This script provides multiple methods to make a user an admin

-- ========================================
-- METHOD 1: Update existing user by email (RECOMMENDED)
-- ========================================
-- Replace 'admin@example.com' with the actual email of the user you want to make admin

DO $$
DECLARE
    target_email TEXT := 'admin@example.com';  -- CHANGE THIS EMAIL
    updated_count INTEGER;
BEGIN
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE email = target_email;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
        RAISE NOTICE 'Successfully updated % user(s) with email % to admin role', updated_count, target_email;
    ELSE
        RAISE NOTICE 'No user found with email %. Try Method 2 or 3.', target_email;
    END IF;
END $$;

-- ========================================
-- METHOD 2: Update by user ID (if you know the UUID)
-- ========================================
-- Uncomment and use if you know the user's UUID from auth.users table
/*
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'USER_UUID_HERE';
*/

-- ========================================
-- METHOD 3: Create admin profile for existing auth user
-- ========================================
-- Use this if the user exists in auth.users but not in profiles table

DO $$
DECLARE
    target_email TEXT := 'admin@example.com';  -- CHANGE THIS EMAIL
    user_exists BOOLEAN;
    profile_exists BOOLEAN;
    inserted_count INTEGER;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = target_email) INTO user_exists;
    
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = target_email) INTO profile_exists;
    
    IF user_exists AND NOT profile_exists THEN
        INSERT INTO public.profiles (id, email, role)
        SELECT id, email, 'admin'
        FROM auth.users 
        WHERE email = target_email;
        
        GET DIAGNOSTICS inserted_count = ROW_COUNT;
        RAISE NOTICE 'Successfully created admin profile for %', target_email;
    ELSIF user_exists AND profile_exists THEN
        RAISE NOTICE 'Profile already exists for %. Use Method 1 to update role.', target_email;
    ELSE
        RAISE NOTICE 'User with email % does not exist in auth.users', target_email;
    END IF;
END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Show all admin users
RAISE NOTICE '=== CURRENT ADMIN USERS ===';
SELECT 
    id, 
    email, 
    role, 
    full_name,
    created_at
FROM public.profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Show all users (to help find the right user if needed)
RAISE NOTICE '=== ALL USERS (for reference) ===';
SELECT 
    id, 
    email, 
    role, 
    full_name,
    created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================
/*
HOW TO USE THIS SCRIPT:

1. UPDATE THE EMAIL: Change 'admin@example.com' to the actual email address
   of the user you want to make admin. There are TWO places to update:
   - In METHOD 1 (line ~9)
   - In METHOD 3 (line ~35)

2. CHOOSE YOUR METHOD:
   - METHOD 1: Best for existing users who already have profiles
   - METHOD 2: Use if you know the user's UUID from auth.users
   - METHOD 3: Use if user exists in auth.users but has no profile yet

3. EXECUTE THE SCRIPT:
   - Run this in Supabase SQL Editor or any PostgreSQL client
   - The script will show output messages indicating success/failure

4. VERIFY:
   - Check the "CURRENT ADMIN USERS" section in the output
   - The user should appear with role = 'admin'

5. TEST:
   - Have the user log out and log back in
   - They should now have access to admin pages at /admin

IMPORTANT NOTES:
- The user must already exist in the auth.users table (they need to have signed up)
- If you get "No user found", the user may not have completed signup yet
- Admin access is controlled by the public.is_admin() function
- The script includes error handling and will show helpful messages
*/
