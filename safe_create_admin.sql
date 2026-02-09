-- Safe admin creation/assignment script
-- Handles existing users and profiles gracefully

DO $$
DECLARE
    user_email TEXT := 'admin@example.com';  -- CHANGE THIS EMAIL
    user_name TEXT := 'Admin User';          -- CHANGE THIS NAME
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
        -- Create new user in auth.users
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
WHERE p.email = 'admin@example.com'  -- CHANGE THIS EMAIL TO MATCH ABOVE
ORDER BY p.created_at DESC;
