-- Seed default site content + ensure required Storage buckets exist

-- Create buckets used by admin uploads (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('banners', 'banners', true),
  ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Default site config (used by header/footer + /setup wizard)
INSERT INTO public.site_content (key, data)
VALUES (
  'site',
  jsonb_build_object(
    'branding', jsonb_build_object(
      'name', 'New Store',
      'logoUrl', ''
    ),
    'footer', jsonb_build_object(
      'about', 'Welcome to your new store. Update this in the Setup page or Admin Site Content.',
      'termsLabel', 'Terms & Conditions'
    ),
    'legal', jsonb_build_object(
      'termsContent', 'Add your Terms & Conditions content here.'
    ),
    'contact', jsonb_build_object(
      'whatsappNumber', ''
    )
  )
)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- Default homepage content (hero + promo cards)
INSERT INTO public.site_content (key, data)
VALUES (
  'homepage',
  jsonb_build_object(
    'hero', jsonb_build_object(
      'title', 'Discover Your Style',
      'subtitle', 'Explore our curated collection of premium products designed for the modern lifestyle.',
      'ctaText', 'Shop Collection',
      'ctaHref', '/products',
      'imageUrl', ''
    ),
    'promoStrip', jsonb_build_object(
      'text', 'FREE shipping on orders over R500'
    ),
    'promoCards', jsonb_build_object(
      'left', jsonb_build_object(
        'badge', 'Limited Time',
        'title', 'Summer Sale',
        'subtitle', 'Up to 40% off selected items',
        'buttonText', 'Shop Sale',
        'buttonHref', '/products',
        'theme', 'amber',
        'imageUrl', ''
      ),
      'right', jsonb_build_object(
        'badge', 'New Collection',
        'title', 'Premium Picks',
        'subtitle', 'Discover our curated selection',
        'buttonText', 'Explore Now',
        'buttonHref', '/products',
        'theme', 'sky',
        'imageUrl', ''
      )
    )
  )
)
ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
