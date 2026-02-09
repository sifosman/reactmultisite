-- Make existing user thecoastalwarehouse@gmail.com an admin
-- User ID from customers table: 1fd34237-de7e-4a3b-9850-fdfe2c90a249

-- Update the user's profile to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '1fd34237-de7e-4a3b-9850-fdfe2c90a249';

-- Verify the change
SELECT 
    p.id, 
    p.email, 
    p.role, 
    p.full_name,
    p.created_at
FROM public.profiles p
WHERE p.id = '1fd34237-de7e-4a3b-9850-fdfe2c90a249';

-- Also show all admin users
SELECT 
    p.id, 
    p.email, 
    p.role, 
    p.full_name,
    p.created_at
FROM public.profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;
