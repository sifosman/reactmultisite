-- 0001_init.sql

create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('admin','customer')),
  created_at timestamptz not null default now()
);

-- Helper to check admin role via profiles
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

alter table public.profiles enable row level security;

-- Addresses
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

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer,
  currency text not null default 'ZAR',
  active boolean not null default true,
  has_variants boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (active);

alter table public.products enable row level security;

-- Product images
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

create index if not exists product_images_product_id_idx on public.product_images (product_id);

alter table public.product_images enable row level security;

-- Variants (unlimited attributes)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique,
  name text,
  price_cents_override integer,
  stock_qty integer not null default 0,
  attributes jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

alter table public.product_variants enable row level security;

-- Carts
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'active' check (status in ('active','converted','abandoned')),
  created_at timestamptz not null default now()
);

create index if not exists carts_user_id_idx on public.carts (user_id);

alter table public.carts enable row level security;

-- Cart items
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete restrict,
  qty integer not null check (qty > 0),
  unit_price_cents_snapshot integer not null check (unit_price_cents_snapshot >= 0),
  title_snapshot text not null,
  variant_snapshot jsonb not null default '{}'::jsonb
);

create index if not exists cart_items_cart_id_idx on public.cart_items (cart_id);

alter table public.cart_items enable row level security;

-- Orders (supports guest checkout)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  customer_email text not null,
  customer_phone text,
  customer_name text,
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded')),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null default 9900 check (shipping_cents = 9900),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'ZAR',
  shipping_address_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete restrict,
  qty integer not null check (qty > 0),
  unit_price_cents_snapshot integer not null check (unit_price_cents_snapshot >= 0),
  title_snapshot text not null,
  variant_snapshot jsonb not null default '{}'::jsonb
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'yoco',
  provider_payment_id text,
  status text not null default 'initiated' check (status in ('initiated','succeeded','failed','cancelled')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'ZAR',
  raw_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);

alter table public.payments enable row level security;

-- Webhook idempotency
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null unique,
  payment_id uuid references public.payments (id) on delete set null,
  received_at timestamptz not null default now(),
  raw_payload jsonb
);

alter table public.payment_events enable row level security;

-- Site content
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  data jsonb not null default '{}'::jsonb
);

alter table public.site_content enable row level security;

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Recreate trigger idempotently
DO $$
begin
  if exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    drop trigger on_auth_user_created on auth.users;
  end if;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- RLS POLICIES
-- =========================

-- profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- addresses
drop policy if exists "addresses_crud_own" on public.addresses;
create policy "addresses_crud_own" on public.addresses
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- categories
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
for select
to anon, authenticated
using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- products
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
for select
to anon, authenticated
using (active = true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- product_images
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read" on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.active = true
  )
);

drop policy if exists "product_images_admin_write" on public.product_images;
create policy "product_images_admin_write" on public.product_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- product_variants
drop policy if exists "product_variants_public_read" on public.product_variants;
create policy "product_variants_public_read" on public.product_variants
for select
to anon, authenticated
using (
  active = true
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id and p.active = true
  )
);

drop policy if exists "product_variants_admin_write" on public.product_variants;
create policy "product_variants_admin_write" on public.product_variants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- carts
drop policy if exists "carts_crud_own" on public.carts;
create policy "carts_crud_own" on public.carts
for all
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

-- cart_items
drop policy if exists "cart_items_crud_own" on public.cart_items;
create policy "cart_items_crud_own" on public.cart_items
for all
to authenticated
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and (c.user_id = auth.uid() or public.is_admin())
  )
)
with check (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and (c.user_id = auth.uid() or public.is_admin())
  )
);

-- orders
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- order_items
drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = auth.uid() or public.is_admin())
  )
);

drop policy if exists "order_items_admin_write" on public.order_items;
create policy "order_items_admin_write" on public.order_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- payments (no public access)
drop policy if exists "payments_select_admin" on public.payments;
create policy "payments_select_admin" on public.payments
for select
to authenticated
using (public.is_admin());

drop policy if exists "payments_write_admin" on public.payments;
create policy "payments_write_admin" on public.payments
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- payment_events (admin only)
drop policy if exists "payment_events_admin_only" on public.payment_events;
create policy "payment_events_admin_only" on public.payment_events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- site_content
drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read" on public.site_content
for select
to anon, authenticated
using (
  key in ('homepage')
);

drop policy if exists "site_content_admin_write" on public.site_content;
create policy "site_content_admin_write" on public.site_content
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- Storage buckets + policies
-- =========================

-- Create buckets (idempotent)
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('banners', 'banners', true)
on conflict (id) do nothing;

-- Public read for these buckets
drop policy if exists "Public read product-images" on storage.objects;
create policy "Public read product-images" on storage.objects
for select
to anon, authenticated
using (bucket_id in ('product-images','banners'));

-- Admin write
drop policy if exists "Admin write product-images" on storage.objects;
create policy "Admin write product-images" on storage.objects
for insert
to authenticated
with check (public.is_admin() and bucket_id in ('product-images','banners'));

drop policy if exists "Admin update product-images" on storage.objects;
create policy "Admin update product-images" on storage.objects
for update
to authenticated
using (public.is_admin() and bucket_id in ('product-images','banners'))
with check (public.is_admin() and bucket_id in ('product-images','banners'));

drop policy if exists "Admin delete product-images" on storage.objects;
create policy "Admin delete product-images" on storage.objects
for delete
to authenticated
using (public.is_admin() and bucket_id in ('product-images','banners'));
