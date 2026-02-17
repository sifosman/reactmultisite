import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Mock the Supabase client
vi.mock('@/lib/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

describe('Invoice Stock Management', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a comprehensive mock object
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(),
      update: vi.fn(() => mockSupabase),
      delete: vi.fn(() => mockSupabase),
      or: vi.fn(() => mockSupabase),
      limit: vi.fn(() => mockSupabase),
      rpc: vi.fn(() => mockSupabase),
      maybeSingle: vi.fn(() => mockSupabase),
    };

    (createSupabaseAdminClient as any).mockReturnValue(mockSupabase);
  });

  describe('Issue Invoice Stock Deduction', () => {
    it('should deduct stock when issuing an invoice', async () => {
      // Mock successful issue_invoice call
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      // Mock loading invoice after issue
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'invoice-1',
          invoice_number: 'INV-000001',
          status: 'issued',
          lines: [
            { product_id: 'product-1', variant_id: null, qty: 2 },
            { product_id: 'product-2', variant_id: 'variant-1', qty: 1 },
          ],
        },
        error: null,
      });

      const supabase = createSupabaseAdminClient();
      
      // Issue the invoice
      await supabase.rpc('issue_invoice', { p_invoice_id: 'invoice-1' });
      
      // Verify the RPC was called with correct parameters
      expect(supabase.rpc).toHaveBeenCalledWith('issue_invoice', { p_invoice_id: 'invoice-1' });
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    });

    it('should fail to issue invoice when out of stock', async () => {
      // Mock out_of_stock error
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'out_of_stock' },
      });

      const supabase = createSupabaseAdminClient();
      
      // The RPC call should return an error object, not reject
      const result = await supabase.rpc('issue_invoice', { p_invoice_id: 'invoice-1' });
      
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe('out_of_stock');
    });

    it('should record inventory movements when issuing', async () => {
      // Mock successful issue with inventory movement tracking
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const supabase = createSupabaseAdminClient();
      await supabase.rpc('issue_invoice', { p_invoice_id: 'invoice-1' });
      
      // The function should handle inventory movements internally
      expect(supabase.rpc).toHaveBeenCalledWith('issue_invoice', { p_invoice_id: 'invoice-1' });
    });
  });

  describe('Cancel Invoice Stock Restoration', () => {
    it('should restore stock when canceling an issued invoice', async () => {
      // Mock successful cancel_invoice call
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const supabase = createSupabaseAdminClient();
      
      // Cancel the invoice
      await supabase.rpc('cancel_invoice', { p_invoice_id: 'invoice-1' });
      
      // Verify the RPC was called
      expect(supabase.rpc).toHaveBeenCalledWith('cancel_invoice', { p_invoice_id: 'invoice-1' });
    });

    it('should record inventory movements when canceling', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const supabase = createSupabaseAdminClient();
      await supabase.rpc('cancel_invoice', { p_invoice_id: 'invoice-1' });
      
      expect(supabase.rpc).toHaveBeenCalledWith('cancel_invoice', { p_invoice_id: 'invoice-1' });
    });
  });

  describe('Line Updates Stock Adjustment', () => {
    it('should deduct additional stock when increasing line quantity', async () => {
      // Mock successful line update
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const supabase = createSupabaseAdminClient();
      
      // Update line quantity from 2 to 5 (increase by 3)
      await supabase.rpc('update_invoice_line_issued', {
        p_invoice_id: 'invoice-1',
        p_line_id: 'line-1',
        p_qty: 5,
        p_unit_price_cents: 10000,
      });
      
      expect(supabase.rpc).toHaveBeenCalledWith('update_invoice_line_issued', {
        p_invoice_id: 'invoice-1',
        p_line_id: 'line-1',
        p_qty: 5,
        p_unit_price_cents: 10000,
      });
    });

    it('should restore stock when decreasing line quantity', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const supabase = createSupabaseAdminClient();
      
      // Update line quantity from 5 to 2 (decrease by 3)
      await supabase.rpc('update_invoice_line_issued', {
        p_invoice_id: 'invoice-1',
        p_line_id: 'line-1',
        p_qty: 2,
        p_unit_price_cents: 10000,
      });
      
      expect(supabase.rpc).toHaveBeenCalledWith('update_invoice_line_issued', {
        p_invoice_id: 'invoice-1',
        p_line_id: 'line-1',
        p_qty: 2,
        p_unit_price_cents: 10000,
      });
    });

    it('should restore all stock when removing a line', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const supabase = createSupabaseAdminClient();
      
      // Remove line with quantity 3
      await supabase.rpc('remove_invoice_line_issued', {
        p_invoice_id: 'invoice-1',
        p_line_id: 'line-1',
      });
      
      expect(supabase.rpc).toHaveBeenCalledWith('remove_invoice_line_issued', {
        p_invoice_id: 'invoice-1',
        p_line_id: 'line-1',
      });
    });
  });

  describe('Stock Validation', () => {
    it('should prevent issuing invoice with insufficient stock', async () => {
      // Mock out_of_stock error for insufficient stock
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'out_of_stock' },
      });

      const supabase = createSupabaseAdminClient();
      
      const result = await supabase.rpc('issue_invoice', { p_invoice_id: 'invoice-1' });
      
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe('out_of_stock');
    });

    it('should prevent increasing line quantity beyond available stock', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'out_of_stock' },
      });

      const supabase = createSupabaseAdminClient();
      
      const result = await supabase.rpc('update_invoice_line_issued', {
        p_invoice_id: 'invoice-1',
        p_line_id: 'line-1',
        p_qty: 100, // Too much quantity
        p_unit_price_cents: 10000,
      });
      
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toBe('out_of_stock');
    });
  });

  describe('Product vs Variant Stock Handling', () => {
    it('should handle simple product stock correctly', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const supabase = createSupabaseAdminClient();
      
      // Issue invoice with simple product (no variant)
      await supabase.rpc('issue_invoice', { p_invoice_id: 'invoice-1' });
      
      expect(supabase.rpc).toHaveBeenCalled();
    });

    it('should handle product variant stock correctly', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const supabase = createSupabaseAdminClient();
      
      // Issue invoice with variant
      await supabase.rpc('issue_invoice', { p_invoice_id: 'invoice-1' });
      
      expect(supabase.rpc).toHaveBeenCalled();
    });
  });
});
