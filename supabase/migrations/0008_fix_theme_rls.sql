-- Fix RLS policies to allow public read access to theme_settings and site keys
-- This allows the frontend to load the theme and site config

DROP POLICY IF EXISTS "site_content_public_read" ON public.site_content;

CREATE POLICY "site_content_public_read" ON public.site_content
FOR SELECT
TO anon, authenticated
USING (
  key IN ('homepage', 'site', 'theme_settings')
);
