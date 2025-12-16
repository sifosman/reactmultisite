-- Add stock quantity for simple products

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS stock_qty integer NOT NULL DEFAULT 0;

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_stock_qty_nonnegative;

ALTER TABLE public.products
ADD CONSTRAINT products_stock_qty_nonnegative CHECK (stock_qty >= 0);

CREATE INDEX IF NOT EXISTS products_stock_qty_idx ON public.products (stock_qty);
