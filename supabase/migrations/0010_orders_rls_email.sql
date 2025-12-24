-- Update orders RLS policy to allow access by user_id OR customer_email
-- This allows users to see orders placed with their email even if user_id doesn't match

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
for select
to authenticated
using (
  user_id = auth.uid() 
  or customer_email = auth.jwt()->>'email'
  or public.is_admin()
);
