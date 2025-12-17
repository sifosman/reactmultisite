-- Invoicing (customers + invoices + invoice lines) and atomic stock movements

create table if not exists public.invoice_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoice_customers enable row level security;

create index if not exists invoice_customers_created_at_idx on public.invoice_customers (created_at);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  status text not null default 'draft' check (status in ('draft','issued','cancelled')),
  customer_id uuid references public.invoice_customers (id) on delete set null,
  customer_snapshot jsonb not null default '{}'::jsonb,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'ZAR',
  created_at timestamptz not null default now(),
  issued_at timestamptz,
  cancelled_at timestamptz
);

alter table public.invoices enable row level security;

create index if not exists invoices_created_at_idx on public.invoices (created_at);
create index if not exists invoices_status_idx on public.invoices (status);

create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete restrict,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  title_snapshot text not null,
  variant_snapshot jsonb not null default '{}'::jsonb,
  line_total_cents integer not null default 0 check (line_total_cents >= 0)
);

alter table public.invoice_lines enable row level security;

create index if not exists invoice_lines_invoice_id_idx on public.invoice_lines (invoice_id);
create index if not exists invoice_lines_product_id_idx on public.invoice_lines (product_id);
create index if not exists invoice_lines_variant_id_idx on public.invoice_lines (variant_id);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references public.product_variants (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  invoice_id uuid references public.invoices (id) on delete set null,
  delta_qty integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.inventory_movements enable row level security;

create index if not exists inventory_movements_invoice_id_idx on public.inventory_movements (invoice_id);
create index if not exists inventory_movements_variant_id_idx on public.inventory_movements (variant_id);
create index if not exists inventory_movements_product_id_idx on public.inventory_movements (product_id);

-- Invoice numbering
create sequence if not exists public.invoice_number_seq;

create or replace function public.next_invoice_number()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select 'INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$;

-- Ensure updated_at on customers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if exists (select 1 from pg_trigger where tgname = 'invoice_customers_set_updated_at') then
    drop trigger invoice_customers_set_updated_at on public.invoice_customers;
  end if;
end $$;

create trigger invoice_customers_set_updated_at
before update on public.invoice_customers
for each row execute procedure public.set_updated_at();

-- Create invoice helper (assigns invoice_number)
create or replace function public.create_invoice(
  customer_id uuid,
  customer_snapshot jsonb,
  currency text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  inv_num text;
begin
  inv_num := public.next_invoice_number();

  insert into public.invoices (
    invoice_number,
    status,
    customer_id,
    customer_snapshot,
    currency
  ) values (
    inv_num,
    'draft',
    customer_id,
    coalesce(customer_snapshot, '{}'::jsonb),
    coalesce(currency, 'ZAR')
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- Recalculate totals from lines
create or replace function public.recalc_invoice_totals(invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  subtotal integer;
  discount integer;
  total integer;
begin
  select coalesce(sum(line_total_cents), 0) into subtotal
  from public.invoice_lines
  where invoice_lines.invoice_id = recalc_invoice_totals.invoice_id;

  select discount_cents into discount
  from public.invoices
  where invoices.id = recalc_invoice_totals.invoice_id;

  total := greatest(subtotal - coalesce(discount, 0), 0);

  update public.invoices
  set subtotal_cents = subtotal,
      total_cents = total
  where id = recalc_invoice_totals.invoice_id;
end;
$$;

-- Atomic stock update when issuing invoice
create or replace function public.issue_invoice(invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  line record;
  updated_count integer;
begin
  select * into inv
  from public.invoices
  where id = issue_invoice.invoice_id
  for update;

  if not found then
    raise exception 'invoice_not_found';
  end if;

  if inv.status <> 'draft' then
    raise exception 'invalid_status';
  end if;

  for line in
    select * from public.invoice_lines where invoice_lines.invoice_id = issue_invoice.invoice_id
  loop
    if line.variant_id is not null then
      update public.product_variants
      set stock_qty = stock_qty - line.qty
      where id = line.variant_id
        and stock_qty >= line.qty;

      get diagnostics updated_count = row_count;
      if updated_count <> 1 then
        raise exception 'out_of_stock';
      end if;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (line.variant_id, line.product_id, issue_invoice.invoice_id, -line.qty, 'invoice_issued');
    else
      update public.products
      set stock_qty = stock_qty - line.qty
      where id = line.product_id
        and has_variants = false
        and stock_qty >= line.qty;

      get diagnostics updated_count = row_count;
      if updated_count <> 1 then
        raise exception 'out_of_stock';
      end if;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (null, line.product_id, issue_invoice.invoice_id, -line.qty, 'invoice_issued');
    end if;
  end loop;

  perform public.recalc_invoice_totals(issue_invoice.invoice_id);

  update public.invoices
  set status = 'issued',
      issued_at = now()
  where id = issue_invoice.invoice_id;
end;
$$;

-- Restore stock when cancelling an issued invoice
create or replace function public.cancel_invoice(invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  line record;
begin
  select * into inv
  from public.invoices
  where id = cancel_invoice.invoice_id
  for update;

  if not found then
    raise exception 'invoice_not_found';
  end if;

  if inv.status <> 'issued' then
    raise exception 'invalid_status';
  end if;

  for line in
    select * from public.invoice_lines where invoice_lines.invoice_id = cancel_invoice.invoice_id
  loop
    if line.variant_id is not null then
      update public.product_variants
      set stock_qty = stock_qty + line.qty
      where id = line.variant_id;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (line.variant_id, line.product_id, cancel_invoice.invoice_id, line.qty, 'invoice_cancelled');
    else
      update public.products
      set stock_qty = stock_qty + line.qty
      where id = line.product_id
        and has_variants = false;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (null, line.product_id, cancel_invoice.invoice_id, line.qty, 'invoice_cancelled');
    end if;
  end loop;

  update public.invoices
  set status = 'cancelled',
      cancelled_at = now()
  where id = cancel_invoice.invoice_id;
end;
$$;

-- RLS Policies (admin only)

drop policy if exists "invoice_customers_admin_only" on public.invoice_customers;
create policy "invoice_customers_admin_only" on public.invoice_customers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "invoices_admin_only" on public.invoices;
create policy "invoices_admin_only" on public.invoices
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "invoice_lines_admin_only" on public.invoice_lines;
create policy "invoice_lines_admin_only" on public.invoice_lines
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "inventory_movements_admin_only" on public.inventory_movements;
create policy "inventory_movements_admin_only" on public.inventory_movements
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
