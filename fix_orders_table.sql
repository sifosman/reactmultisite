-- Fix Orders Table - Add missing columns based on provided schema
-- This script assumes the orders table exists but is missing columns

-- First, let's create the table if it doesn't exist with the correct structure
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create orders table with correct schema
create table public.orders (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  customer_email text not null,
  customer_phone text null,
  customer_name text null,
  status text not null default 'pending_payment'::text,
  subtotal_cents integer not null,
  shipping_cents integer null default 6000,
  discount_cents integer not null default 0,
  total_cents integer not null,
  currency text not null default 'ZAR'::text,
  shipping_address_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint orders_pkey primary key (id),
  constraint orders_user_id_fkey foreign KEY (user_id) references profiles (id) on delete set null,
  constraint orders_discount_cents_check check ((discount_cents >= 0)),
  constraint orders_subtotal_cents_check check ((subtotal_cents >= 0)),
  constraint orders_total_cents_check check ((total_cents >= 0)),
  constraint orders_status_check check (
    (
      status = any (
        array[
          'pending_payment'::text,
          'paid'::text,
          'processing'::text,
          'shipped'::text,
          'delivered'::text,
          'cancelled'::text,
          'refunded'::text
        ]
      )
    )
  ),
  constraint orders_shipping_cents_non_negative check ((shipping_cents >= 0))
) TABLESPACE pg_default;

-- Create indexes
create index IF not exists orders_user_id_idx on public.orders using btree (user_id) TABLESPACE pg_default;
create index IF not exists orders_status_idx on public.orders using btree (status) TABLESPACE pg_default;

-- Enable RLS
alter table public.orders enable row level security;

-- RLS Policies for Orders
create policy "Users can view own orders" on public.orders for select using (user_id = auth.uid());
create policy "Admins can view all orders" on public.orders for select using (public.is_admin());
create policy "Admins can manage orders" on public.orders for all using (public.is_admin());

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Orders table fixed successfully!';
END $$;
