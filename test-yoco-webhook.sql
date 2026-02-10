-- Test Yoco webhook processing
-- Check if webhooks are being received and processed

-- 1. Check recent payment events from Yoco
SELECT 
    provider,
    provider_event_id,
    created_at,
    raw_payload::text
FROM payment_events 
WHERE provider = 'yoco' 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check pending checkouts that might be stuck
SELECT 
    id,
    status,
    customer_email,
    total_cents,
    currency,
    created_at,
    checkout_id
FROM pending_checkouts 
WHERE status = 'initiated' 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check recent orders with their status
SELECT 
    id,
    status,
    customer_email,
    total_cents,
    created_at
FROM orders 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check payments table for Yoco payments
SELECT 
    order_id,
    provider,
    status,
    amount_cents,
    created_at,
    raw_payload::text
FROM payments 
WHERE provider = 'yoco' 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check if there are any orders without corresponding payments
SELECT 
    o.id as order_id,
    o.status,
    o.customer_email,
    o.total_cents,
    p.provider as payment_provider,
    p.status as payment_status
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE o.created_at >= NOW() - INTERVAL '7 days'
AND (p.provider IS NULL OR p.provider != 'yoco')
ORDER BY o.created_at DESC;
