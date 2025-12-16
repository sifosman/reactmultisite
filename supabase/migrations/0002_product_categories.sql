-- 0002_product_categories.sql

-- Junction table for many-to-many product <-> category assignment
create table if not exists public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create index if not exists product_categories_category_id_idx on public.product_categories (category_id);

alter table public.product_categories enable row level security;

-- Public can read category assignments for active products
drop policy if exists "product_categories_public_read" on public.product_categories;
create policy "product_categories_public_read" on public.product_categories
for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_categories.product_id and p.active = true
  )
);

-- Admin can manage assignments
drop policy if exists "product_categories_admin_write" on public.product_categories;
create policy "product_categories_admin_write" on public.product_categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
