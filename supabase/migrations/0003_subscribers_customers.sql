-- Newsletter subscribers + customers tables

CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'newsletter',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert). Reads are admin-only.
DROP POLICY IF EXISTS "subscribers_public_insert" ON public.subscribers;
CREATE POLICY "subscribers_public_insert" ON public.subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "subscribers_admin_read" ON public.subscribers;
CREATE POLICY "subscribers_admin_read" ON public.subscribers
FOR SELECT
TO authenticated
USING (public.is_admin());


CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  total_orders integer NOT NULL DEFAULT 0,
  total_spent_cents integer NOT NULL DEFAULT 0,
  last_order_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_user_id_idx ON public.customers (user_id);
CREATE INDEX IF NOT EXISTS customers_email_idx ON public.customers (email);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_admin_read" ON public.customers;
CREATE POLICY "customers_admin_read" ON public.customers
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only service role (server) should write
DROP POLICY IF EXISTS "customers_service_write" ON public.customers;
CREATE POLICY "customers_service_write" ON public.customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
