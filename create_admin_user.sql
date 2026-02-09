-- Create a user and assign admin role in one script
-- Replace 'admin@example.com' and 'Admin User' with actual details

DO $$
DECLARE
    user_email TEXT := 'admin@example.com';  -- CHANGE THIS EMAIL
    user_name TEXT := 'Admin User';          -- CHANGE THIS NAME
    user_password TEXT := 'temp_password_123'; -- CHANGE THIS PASSWORD
    user_id UUID;
BEGIN
    -- Step 1: Create user in auth.users
    -- Note: This requires service role key or admin access
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
    
    -- Step 2: Create corresponding profile with admin role
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
    
    RAISE NOTICE 'Successfully created admin user: %', user_email;
END $$;

-- Verify the admin was created
SELECT 
    p.id, 
    p.email, 
    p.role, 
    p.full_name,
    p.created_at
FROM public.profiles p
WHERE p.role = 'admin';

-- Note: The user will need to reset their password when they first log in
-- or you can set a temporary password using auth.users.password_hash
