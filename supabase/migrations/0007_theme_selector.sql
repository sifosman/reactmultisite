-- Add theme selection support to site_content table
-- Store selected theme in site_content with key 'theme_settings'

INSERT INTO public.site_content (key, data)
VALUES (
  'theme_settings',
  jsonb_build_object(
    'selectedTheme', 'default',
    'lastUpdated', NOW()
  )
)
ON CONFLICT (key) DO NOTHING;
