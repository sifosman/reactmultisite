-- Add customer-friendly order numbers
-- Short, memorable numbers that customers can easily communicate over the phone

-- Add order_number column to orders table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_number') THEN
    ALTER TABLE public.orders ADD COLUMN order_number text;
  END IF;
END $$;

-- Create sequence for order numbers (shorter than invoices)
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq
  START WITH 1000
  INCREMENT BY 1
  MINVALUE 1000
  MAXVALUE 999999;

-- Create function to generate next order number
CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'ORD-' || nextval('public.order_number_seq')::text;
$$;

-- Create trigger to automatically assign order numbers
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := public.next_order_number();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS orders_set_order_number ON public.orders;

-- Create trigger to auto-generate order numbers on insert
CREATE TRIGGER orders_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Add unique constraint on order numbers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'orders' AND constraint_name = 'orders_order_number_unique') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
  END IF;
END $$;

-- Create index for faster lookups by order number
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);

-- Backfill existing orders with order numbers (only if they don't have one)
UPDATE public.orders 
SET order_number = public.next_order_number() 
WHERE order_number IS NULL;
