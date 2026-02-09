-- Quick admin assignment - just change the email and run
UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';

-- Verify the change
SELECT id, email, role, created_at FROM public.profiles WHERE role = 'admin';
