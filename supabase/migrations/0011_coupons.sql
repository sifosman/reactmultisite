-- Create coupons table for discount codes
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  min_order_value_cents integer,
  max_uses integer,
  usage_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON public.coupons (code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON public.coupons (active);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Admin can read/write coupons
DROP POLICY IF EXISTS "coupons_admin_read" ON public.coupons;
CREATE POLICY "coupons_admin_read" ON public.coupons
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "coupons_admin_write" ON public.coupons;
CREATE POLICY "coupons_admin_write" ON public.coupons
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Service role can read for checkout validation
DROP POLICY IF EXISTS "coupons_service_read" ON public.coupons;
CREATE POLICY "coupons_service_read" ON public.coupons
FOR SELECT
TO service_role
USING (true);
