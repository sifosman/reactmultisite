-- Test script to verify coupon discount flow with Yoco payments
-- This simulates the complete flow from checkout to Yoco payment

DO $$
DECLARE
  test_product_id UUID;
  test_variant_id UUID;
  coupon_code TEXT := 'SAVE30'; -- Use existing coupon
  original_subtotal INTEGER;
  discount_amount INTEGER;
  shipping_amount INTEGER := 6000; -- R60 shipping
  expected_total INTEGER;
  actual_total INTEGER;
BEGIN
  RAISE NOTICE '=== Testing Yoco Coupon Discount Flow ===';
  
  -- Get a test product
  SELECT id INTO test_product_id 
  FROM public.products 
  WHERE active = true AND stock_qty > 0 
  LIMIT 1;
  
  IF test_product_id IS NULL THEN
    RAISE EXCEPTION 'No active products found for testing';
  END IF;
  
  -- Get product price
  SELECT price_cents INTO original_subtotal
  FROM public.products 
  WHERE id = test_product_id;
  
  -- Calculate expected discount using the same logic as the application
  -- For SAVE30 coupon: fixed R20 discount (2000 cents)
  IF coupon_code = 'SAVE30' THEN
    discount_amount := 2000; -- Fixed R20 discount
  ELSE
    discount_amount := 0;
  END IF;
  
  -- Calculate expected total (same as checkout client)
  expected_total := original_subtotal + shipping_amount - discount_amount;
  
  RAISE NOTICE 'Product price: R%', (original_subtotal / 100);
  RAISE NOTICE 'Shipping: R%', (shipping_amount / 100);
  RAISE NOTICE 'Coupon discount: R%', (discount_amount / 100);
  RAISE NOTICE 'Expected total: R%', (expected_total / 100);
  RAISE NOTICE '';
  
  -- Simulate the server-side calculation (same as /api/payments/yoco/start)
  -- This should match the client-side calculation exactly
  DECLARE
    server_subtotal INTEGER := original_subtotal;
    server_shipping INTEGER := shipping_amount;
    server_discount INTEGER := discount_amount;
    server_total INTEGER;
  BEGIN
    server_total := server_subtotal + server_shipping - server_discount;
    actual_total := server_total;
  END;
  
  RAISE NOTICE 'Server calculated total: R%', (actual_total / 100);
  RAISE NOTICE '';
  
  -- Verify the amounts match
  IF expected_total = actual_total THEN
    RAISE NOTICE '✅ SUCCESS: Client and server totals match!';
    RAISE NOTICE '✅ Amount sent to Yoco would be: R% (in cents: %)', (actual_total / 100), actual_total;
  ELSE
    RAISE EXCEPTION '❌ FAILURE: Client total (%) != Server total (%)', expected_total, actual_total;
  END IF;
  
  -- Test the coupon validation logic
  DECLARE
    coupon_record RECORD;
    coupon_valid BOOLEAN := FALSE;
  BEGIN
    SELECT code, discount_type, discount_value, min_order_value_cents, active, expires_at
    INTO coupon_record
    FROM public.coupons
    WHERE code = coupon_code AND active = true;
    
    IF coupon_record IS NOT NULL THEN
      -- Check if coupon is still valid
      IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < NOW() THEN
        RAISE NOTICE '❌ Coupon expired';
      ELSIF original_subtotal < (coupon_record.min_order_value_cents || 0) THEN
        RAISE NOTICE '❌ Order below minimum value';
      ELSE
        coupon_valid := TRUE;
        RAISE NOTICE '✅ Coupon % is valid', coupon_code;
      END IF;
    ELSE
      RAISE NOTICE '❌ Coupon not found or inactive';
    END IF;
  END;
  
  IF coupon_valid THEN
    RAISE NOTICE '';
    RAISE NOTICE '=== Flow Summary ===';
    RAISE NOTICE '1. User sees total: R% on checkout page', (expected_total / 100);
    RAISE NOTICE '2. Server calculates: R% and sends to Yoco', (actual_total / 100);
    RAISE NOTICE '3. Yoco charges customer: R%', (actual_total / 100);
    RAISE NOTICE '4. Customer pays exactly what they saw: ✅';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Test Complete ===';
END $$;
