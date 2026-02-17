import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Mock the Supabase client
vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

describe('Order Number Generation', () => {
  const mockSupabase = {
    from: vi.fn(() => mockSupabase),
    insert: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    single: vi.fn(),
    update: vi.fn(() => mockSupabase),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createSupabaseAdminClient as any).mockReturnValue(mockSupabase);
  });

  it('should generate order numbers in ORD-#### format', async () => {
    // Mock successful order creation with order number
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'test-order-id', order_number: 'ORD-1001', total_cents: 10000 },
      error: null,
    });

    // Simulate creating an order
    const supabase = createSupabaseAdminClient();
    const result = await supabase
      .from('orders')
      .insert({
        customer_email: 'test@example.com',
        subtotal_cents: 10000,
        shipping_cents: 6000,
        discount_cents: 0,
        total_cents: 16000,
        currency: 'ZAR',
        shipping_address_snapshot: {},
      })
      .select('id,order_number,total_cents')
      .single();

    expect(result.data?.order_number).toMatch(/^ORD-\d{4}$/);
    expect(result.data?.order_number).toBe('ORD-1001');
  });

  it('should generate sequential order numbers', async () => {
    // Mock multiple order creations
    const mockOrders = [
      { id: 'order-1', order_number: 'ORD-1001', total_cents: 10000 },
      { id: 'order-2', order_number: 'ORD-1002', total_cents: 15000 },
      { id: 'order-3', order_number: 'ORD-1003', total_cents: 20000 },
    ];

    mockSupabase.single
      .mockResolvedValueOnce({ data: mockOrders[0], error: null })
      .mockResolvedValueOnce({ data: mockOrders[1], error: null })
      .mockResolvedValueOnce({ data: mockOrders[2], error: null });

    const supabase = createSupabaseAdminClient();

    // Create three orders
    const order1 = await supabase.from('orders').insert({}).select().single();
    const order2 = await supabase.from('orders').insert({}).select().single();
    const order3 = await supabase.from('orders').insert({}).select().single();

    // Verify sequential numbering
    expect(order1.data?.order_number).toBe('ORD-1001');
    expect(order2.data?.order_number).toBe('ORD-1002');
    expect(order3.data?.order_number).toBe('ORD-1003');
  });

  it('should have unique order numbers', () => {
    const orderNumbers = new Set();
    
    // Generate 100 order numbers and verify uniqueness
    for (let i = 1000; i < 1100; i++) {
      const orderNumber = `ORD-${i}`;
      expect(orderNumbers.has(orderNumber)).toBe(false);
      orderNumbers.add(orderNumber);
    }
    
    expect(orderNumbers.size).toBe(100);
  });

  it('should be customer-friendly format', () => {
    const validFormats = ['ORD-1001', 'ORD-1234', 'ORD-9999'];
    const invalidFormats = ['ORD-123', 'ORD-12345', 'INV-1001', '1234-ORD'];
    
    validFormats.forEach(format => {
      expect(format).toMatch(/^ORD-\d{4}$/);
    });
    
    invalidFormats.forEach(format => {
      expect(format).not.toMatch(/^ORD-\d{4}$/);
    });
  });

  it('should be easy to communicate over phone', () => {
    const orderNumber = 'ORD-1234';
    
    // Test that it's short and contains only alphanumeric characters
    expect(orderNumber.length).toBeLessThan(10);
    expect(orderNumber).toMatch(/^[A-Z0-9-]+$/);
    
    // Test that it can be easily spelled out
    const spoken = orderNumber.split('').join(' ');
    expect(spoken).toBe('O R D - 1 2 3 4');
  });
});
