-- Complete Database Setup for Coastal Warehouse
-- This script creates all necessary tables and functions

-- Enable pgcrypto extension
create extension if not exists pgcrypto;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);

-- Helper function to check admin role
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Addresses table
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  province text not null,
  postal_code text not null,
  country text not null default 'ZA',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.addresses enable row level security;

-- Categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz not null default now(),
  sort_index integer not null default 0
);

-- Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (compare_at_price_cents >= 0),
  currency text not null default 'ZAR',
  active boolean not null default true,
  has_variants boolean not null default false,
  created_at timestamptz not null default now(),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  category_id uuid references public.categories(id) on delete set null
);

-- Product variants table
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  price_cents_override integer check (price_cents_override >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  customer_email text not null,
  customer_phone text,
  customer_name text,
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 6000 check (shipping_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'ZAR',
  shipping_address_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for orders
create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

-- Order items table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete restrict,
  qty integer not null check (qty > 0),
  unit_price_cents_snapshot integer not null check (unit_price_cents_snapshot >= 0),
  title_snapshot text not null,
  created_at timestamptz not null default now()
);

-- Cart table (for guest checkout)
create table if not exists public.cart (
  id uuid primary key default gen_random_uuid(),
  guest_id text not null,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  qty integer not null check (qty > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(guest_id, product_id, variant_id)
);

-- Coupons table
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value integer not null check (discount_value > 0),
  min_order_value_cents integer check (min_order_value_cents >= 0),
  max_uses integer check (max_uses > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','issued','paid','cancelled','refunded')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  vat_amount_cents integer not null default 0 check (vat_amount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0),
  balance_due_cents integer not null check (balance_due_cents >= 0),
  currency text not null default 'ZAR',
  issue_date timestamptz not null default now(),
  due_date timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Additional columns for our fixes
  delivery_cents integer not null default 0 check (delivery_cents >= 0),
  payment_status text check (payment_status in ('unpaid', 'paid')),
  payment_status_updated_at timestamptz,
  fulfilment_status text check (fulfilment_status in ('pending', 'dispatched')),
  fulfilment_status_updated_at timestamptz
);

-- Invoice lines table
create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customers table (separate from profiles for guest orders)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  phone text,
  address jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on all tables
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.cart enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.categories enable row level security;
alter table public.coupons enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;
alter table public.customers enable row level security;

-- RLS Policies for Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());
create policy "Admins can insert profiles" on public.profiles for insert with check (public.is_admin());
create policy "Admins can update profiles" on public.profiles for update using (public.is_admin());

-- RLS Policies for Products (public read, admin write)
create policy "Products are public" on public.products for select using (true);
create policy "Admins can manage products" on public.products for all using (public.is_admin());

-- RLS Policies for Orders
create policy "Users can view own orders" on public.orders for select using (user_id = auth.uid());
create policy "Admins can view all orders" on public.orders for select using (public.is_admin());
create policy "Admins can manage orders" on public.orders for all using (public.is_admin());

-- RLS Policies for Order Items
create policy "Users can view own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "Admins can view all order items" on public.order_items for select using (public.is_admin());
create policy "Admins can manage order items" on public.order_items for all using (public.is_admin());

-- RLS Policies for Cart (guest access)
create policy "Guest cart access" on public.cart for all using (true);

-- RLS Policies for Categories (public)
create policy "Categories are public" on public.categories for select using (true);
create policy "Admins can manage categories" on public.categories for all using (public.is_admin());

-- RLS Policies for Coupons
create policy "Active coupons are public" on public.coupons for select using (active = true);
create policy "Admins can manage coupons" on public.coupons for all using (public.is_admin());

-- RLS Policies for Invoices
create policy "Users can view own invoices" on public.invoices for select using (customer_id = auth.uid());
create policy "Admins can view all invoices" on public.invoices for select using (public.is_admin());
create policy "Admins can manage invoices" on public.invoices for all using (public.is_admin());

-- RLS Policies for Invoice Lines
create policy "Users can view own invoice lines" on public.invoice_lines for select using (
  exists (select 1 from public.invoices where id = invoice_id and customer_id = auth.uid())
);
create policy "Admins can view all invoice lines" on public.invoice_lines for select using (public.is_admin());
create policy "Admins can manage invoice lines" on public.invoice_lines for all using (public.is_admin());

-- RLS Policies for Customers
create policy "Users can view own customer record" on public.customers for select using (id = auth.uid());
create policy "Admins can view all customers" on public.customers for select using (public.is_admin());
create policy "Admins can manage customers" on public.customers for all using (public.is_admin());

-- Insert sample category if none exists
insert into public.categories (id, name, slug, sort_index)
values (gen_random_uuid(), 'General', 'general', 0)
on conflict (id) do nothing;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Tables created: profiles, addresses, categories, products, product_variants, orders, order_items, cart, coupons, invoices, invoice_lines, customers';
  RAISE NOTICE 'RLS policies enabled for all tables';
  RAISE NOTICE 'Sample category "General" inserted';
END $$;
