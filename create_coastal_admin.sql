-- Complete script to create admin user: thecoastalwarehouse@gmail.com
-- This script handles user creation and admin assignment

DO $$
DECLARE
    user_email TEXT := 'thecoastalwarehouse@gmail.com';
    user_name TEXT := 'Sameer';
    user_id UUID;
    profile_exists BOOLEAN;
    user_exists BOOLEAN;
BEGIN
    -- Check if user exists in auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = user_email) INTO user_exists;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE email = user_email) INTO profile_exists;
    
    RAISE NOTICE 'User exists: %, Profile exists: %', user_exists, profile_exists;
    
    IF NOT user_exists THEN
        -- Create new user in auth.users (without password - user will set it on first login)
        INSERT INTO auth.users (
            id,
            email,
            email_confirmed_at,
            phone,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            user_email,
            now(),
            null,
            now(),
            now(),
            jsonb_build_object('full_name', user_name)
        ) 
        RETURNING id INTO user_id;
        
        RAISE NOTICE 'Created new user with ID: %', user_id;
        RAISE NOTICE 'NOTE: User will need to set password "Sameer1964!" on first login via password reset';
    ELSE
        -- Get existing user ID
        SELECT id INTO user_id FROM auth.users WHERE email = user_email;
        RAISE NOTICE 'Using existing user ID: %', user_id;
    END IF;
    
    IF NOT profile_exists THEN
        -- Create new profile with admin role
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role
        ) VALUES (
            user_id,
            user_email,
            user_name,
            'admin'
        );
        
        RAISE NOTICE 'Created new admin profile for: %', user_email;
    ELSE
        -- Update existing profile to admin role
        UPDATE public.profiles 
        SET role = 'admin', full_name = user_name
        WHERE email = user_email;
        
        RAISE NOTICE 'Updated existing profile to admin role for: %', user_email;
    END IF;
    
    RAISE NOTICE 'Admin setup completed for: %', user_email;
END $$;

-- Verify the admin was created/updated
SELECT 
    p.id, 
    p.email, 
    p.role, 
    p.full_name,
    p.created_at
FROM public.profiles p
WHERE p.email = 'thecoastalwarehouse@gmail.com'
ORDER BY p.created_at DESC;

-- NEXT STEPS:
-- 1. Run this script in Supabase SQL Editor
-- 2. Go to your website's login page
-- 3. Click "Forgot Password" for thecoastalwarehouse@gmail.com
-- 4. Set the password as "Sameer1964!"
-- 5. Log in and you should have admin access at /admin
