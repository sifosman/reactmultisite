alter table public.pending_checkouts
add column if not exists coupon_code text;

alter table public.pending_checkouts
add column if not exists discount_cents integer not null default 0 check (discount_cents >= 0);
