-- seed.sql

-- Basic homepage content placeholder
insert into public.site_content (key, data)
values (
  'homepage',
  jsonb_build_object(
    'hero', jsonb_build_object(
      'title', 'Affordable Finds',
      'subtitle', 'Shop the latest deals',
      'ctaText', 'Shop Now',
      'ctaHref', '/products'
    ),
    'promoStrip', jsonb_build_object(
      'text', 'Flat shipping R99 anywhere in South Africa'
    ),
    'secondaryBanners', '[]'::jsonb,
    'featuredCategories', '[]'::jsonb,
    'featuredProducts', '[]'::jsonb
  )
)
on conflict (key) do nothing;
