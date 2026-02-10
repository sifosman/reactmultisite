-- Test email configuration
-- This script helps verify that the email service is working

-- Check if SMTP is enabled in the auth configuration
-- Note: This needs to be verified in the Supabase dashboard

-- Test the email rate limits
SELECT 
  email_sent,
  max_frequency,
  otp_length,
  otp_expiry
FROM auth.settings 
WHERE key IN ('email_sent', 'max_frequency', 'otp_length', 'otp_expiry');

-- Check if email confirmations are enabled
SELECT 
  enable_signup,
  enable_confirmations,
  secure_password_change
FROM auth.settings 
WHERE key IN ('enable_signup', 'enable_confirmations', 'secure_password_change');

-- Verify user email exists for testing
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users 
WHERE email = 'thecoastalwarehouse@gmail.com';
