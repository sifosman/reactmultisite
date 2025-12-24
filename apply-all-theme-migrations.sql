-- Run this entire file in your Supabase SQL Editor to enable theme selector
-- This includes both the initial setup and the RLS policy fix

-- Step 1: Add theme selection support to site_content table
INSERT INTO public.site_content (key, data)
VALUES (
  'theme_settings',
  jsonb_build_object(
    'selectedTheme', 'default',
    'lastUpdated', NOW()
  )
)
ON CONFLICT (key) DO NOTHING;

-- Step 2: Fix RLS policies to allow public read access to theme_settings
DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;

CREATE POLICY "site_content_public_read" ON public.site_content
FOR SELECT
TO anon, authenticated
USING (
  key IN ('homepage', 'site', 'theme_settings')
);
