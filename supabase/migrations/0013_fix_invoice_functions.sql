-- Fix ambiguous column reference in recalc_invoice_totals function
-- and add missing payment/fulfilment columns to invoices

-- Add missing columns to invoices table if they don't exist
DO $$
BEGIN
  -- Add delivery_cents column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'delivery_cents') THEN
    ALTER TABLE public.invoices ADD COLUMN delivery_cents integer NOT NULL DEFAULT 0 CHECK (delivery_cents >= 0);
  END IF;

  -- Add payment_status column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'payment_status') THEN
    ALTER TABLE public.invoices ADD COLUMN payment_status text CHECK (payment_status IN ('unpaid', 'paid'));
  END IF;

  -- Add payment_status_updated_at column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'payment_status_updated_at') THEN
    ALTER TABLE public.invoices ADD COLUMN payment_status_updated_at timestamptz;
  END IF;

  -- Add fulfilment_status column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'fulfilment_status') THEN
    ALTER TABLE public.invoices ADD COLUMN fulfilment_status text CHECK (fulfilment_status IN ('pending', 'dispatched'));
  END IF;

  -- Add fulfilment_status_updated_at column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'fulfilment_status_updated_at') THEN
    ALTER TABLE public.invoices ADD COLUMN fulfilment_status_updated_at timestamptz;
  END IF;
END $$;

-- Fix recalc_invoice_totals function to avoid ambiguous column reference
create or replace function public.recalc_invoice_totals(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal integer;
  v_discount integer;
  v_delivery integer;
  v_total integer;
begin
  -- Calculate subtotal from invoice lines
  select coalesce(sum(il.line_total_cents), 0) into v_subtotal
  from public.invoice_lines il
  where il.invoice_id = p_invoice_id;

  -- Get discount from invoice
  select i.discount_cents into v_discount
  from public.invoices i
  where i.id = p_invoice_id;

  -- Get delivery from invoice
  select i.delivery_cents into v_delivery
  from public.invoices i
  where i.id = p_invoice_id;

  -- Calculate total (subtotal + delivery - discount, never less than 0)
  v_total := greatest(v_subtotal + coalesce(v_delivery, 0) - coalesce(v_discount, 0), 0);

  -- Update invoice totals
  update public.invoices
  set subtotal_cents = v_subtotal,
      total_cents = v_total
  where id = p_invoice_id;
end;
$$;

-- Fix issue_invoice function to use explicit table references
create or replace function public.issue_invoice(p_invoice_id uuid)
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
  from public.invoices i
  where i.id = p_invoice_id
  for update;

  if not found then
    raise exception 'invoice_not_found';
  end if;

  if inv.status <> 'draft' then
    raise exception 'invalid_status';
  end if;

  for line in
    select il.* from public.invoice_lines il where il.invoice_id = p_invoice_id
  loop
    if line.variant_id is not null then
      update public.product_variants pv
      set stock_qty = pv.stock_qty - line.qty
      where pv.id = line.variant_id
        and pv.stock_qty >= line.qty;

      get diagnostics updated_count = row_count;
      if updated_count <> 1 then
        raise exception 'out_of_stock';
      end if;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (line.variant_id, line.product_id, p_invoice_id, -line.qty, 'invoice_issued');
    else
      update public.products p
      set stock_qty = p.stock_qty - line.qty
      where p.id = line.product_id
        and p.has_variants = false
        and p.stock_qty >= line.qty;

      get diagnostics updated_count = row_count;
      if updated_count <> 1 then
        raise exception 'out_of_stock';
      end if;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (null, line.product_id, p_invoice_id, -line.qty, 'invoice_issued');
    end if;
  end loop;

  perform public.recalc_invoice_totals(p_invoice_id);

  update public.invoices i
  set status = 'issued',
      issued_at = now()
  where i.id = p_invoice_id;
end;
$$;

-- Fix cancel_invoice function
create or replace function public.cancel_invoice(p_invoice_id uuid)
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
  from public.invoices i
  where i.id = p_invoice_id
  for update;

  if not found then
    raise exception 'invoice_not_found';
  end if;

  if inv.status <> 'issued' then
    raise exception 'invalid_status';
  end if;

  for line in
    select il.* from public.invoice_lines il where il.invoice_id = p_invoice_id
  loop
    if line.variant_id is not null then
      update public.product_variants pv
      set stock_qty = pv.stock_qty + line.qty
      where pv.id = line.variant_id;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (line.variant_id, line.product_id, p_invoice_id, line.qty, 'invoice_cancelled');
    else
      update public.products p
      set stock_qty = p.stock_qty + line.qty
      where p.id = line.product_id
        and p.has_variants = false;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (null, line.product_id, p_invoice_id, line.qty, 'invoice_cancelled');
    end if;
  end loop;

  update public.invoices i
  set status = 'cancelled',
      cancelled_at = now()
  where i.id = p_invoice_id;
end;
$$;

-- Create function to update line on issued invoice with explicit parameters
create or replace function public.update_invoice_line_issued(
  p_invoice_id uuid,
  p_line_id uuid,
  p_qty integer,
  p_unit_price_cents integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_line record;
  qty_diff integer;
  updated_count integer;
begin
  -- Get current line
  select il.* into current_line
  from public.invoice_lines il
  where il.id = p_line_id
    and il.invoice_id = p_invoice_id;

  if not found then
    raise exception 'line_not_found';
  end if;

  qty_diff := p_qty - current_line.qty;

  -- Update stock if quantity changed
  if qty_diff > 0 then
    -- Increasing quantity - check stock
    if current_line.variant_id is not null then
      update public.product_variants pv
      set stock_qty = pv.stock_qty - qty_diff
      where pv.id = current_line.variant_id
        and pv.stock_qty >= qty_diff;

      get diagnostics updated_count = row_count;
      if updated_count <> 1 then
        raise exception 'out_of_stock';
      end if;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (current_line.variant_id, current_line.product_id, p_invoice_id, -qty_diff, 'line_updated_increase');
    else
      update public.products p
      set stock_qty = p.stock_qty - qty_diff
      where p.id = current_line.product_id
        and p.has_variants = false
        and p.stock_qty >= qty_diff;

      get diagnostics updated_count = row_count;
      if updated_count <> 1 then
        raise exception 'out_of_stock';
      end if;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (null, current_line.product_id, p_invoice_id, -qty_diff, 'line_updated_increase');
    end if;
  elsif qty_diff < 0 then
    -- Decreasing quantity - restore stock
    if current_line.variant_id is not null then
      update public.product_variants pv
      set stock_qty = pv.stock_qty + abs(qty_diff)
      where pv.id = current_line.variant_id;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (current_line.variant_id, current_line.product_id, p_invoice_id, abs(qty_diff), 'line_updated_decrease');
    else
      update public.products p
      set stock_qty = p.stock_qty + abs(qty_diff)
      where p.id = current_line.product_id
        and p.has_variants = false;

      insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
      values (null, current_line.product_id, p_invoice_id, abs(qty_diff), 'line_updated_decrease');
    end if;
  end if;

  -- Update line
  update public.invoice_lines il
  set qty = p_qty,
      unit_price_cents = p_unit_price_cents,
      line_total_cents = p_qty * p_unit_price_cents
  where il.id = p_line_id;

  -- Recalculate totals
  perform public.recalc_invoice_totals(p_invoice_id);
end;
$$;

-- Create function to remove line from issued invoice
create or replace function public.remove_invoice_line_issued(
  p_invoice_id uuid,
  p_line_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
begin
  -- Get line
  select il.* into line
  from public.invoice_lines il
  where il.id = p_line_id
    and il.invoice_id = p_invoice_id;

  if not found then
    raise exception 'line_not_found';
  end if;

  -- Restore stock
  if line.variant_id is not null then
    update public.product_variants pv
    set stock_qty = pv.stock_qty + line.qty
    where pv.id = line.variant_id;

    insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
    values (line.variant_id, line.product_id, p_invoice_id, line.qty, 'line_removed');
  else
    update public.products p
    set stock_qty = p.stock_qty + line.qty
    where p.id = line.product_id
      and p.has_variants = false;

    insert into public.inventory_movements (variant_id, product_id, invoice_id, delta_qty, reason)
    values (null, line.product_id, p_invoice_id, line.qty, 'line_removed');
  end if;

  -- Delete line
  delete from public.invoice_lines il
  where il.id = p_line_id;

  -- Recalculate totals
  perform public.recalc_invoice_totals(p_invoice_id);
end;
$$;
