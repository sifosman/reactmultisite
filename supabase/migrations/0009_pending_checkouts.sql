-- Pending checkouts table for Yoco flow
-- Stores cart + customer + shipping data before Yoco payment succeeds
-- Once payment succeeds via webhook, we create the order and mark this as completed

create table if not exists public.pending_checkouts (
  id uuid primary key default gen_random_uuid(),
  checkout_id text,                   -- Yoco checkout ID (set after calling Yoco API)
  status text not null default 'initiated' check (status in ('initiated', 'completed', 'cancelled')),
  
  -- Customer info
  customer_email text not null,
  customer_name text,
  customer_phone text,
  
  -- Shipping address snapshot
  shipping_address_snapshot jsonb not null,
  
  -- Cart items snapshot (productId, variantId, qty for each)
  items jsonb not null,
  
  -- Computed totals (in cents)
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'ZAR',
  
  -- User association (if logged in)
  user_id uuid references public.profiles (id) on delete set null,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pending_checkouts_checkout_id_idx on public.pending_checkouts (checkout_id);
create index if not exists pending_checkouts_status_idx on public.pending_checkouts (status);
create index if not exists pending_checkouts_created_at_idx on public.pending_checkouts (created_at);

alter table public.pending_checkouts enable row level security;

-- Only service role can write/read pending checkouts (server-side only)
drop policy if exists "pending_checkouts_service_only" on public.pending_checkouts;
create policy "pending_checkouts_service_only" on public.pending_checkouts
for all
to service_role
using (true)
with check (true);
