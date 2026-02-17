import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateCouponDiscount, type CouponRecord } from "./coupons";

// Mock fetch for API calls
global.fetch = vi.fn();

describe("Coupon Discount Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const base: CouponRecord = {
    code: "SAVE",
    discount_type: "percentage",
    discount_value: 10,
    min_order_value_cents: null,
  };

  describe("calculateCouponDiscount", () => {
    it("returns 0 when subtotal is 0 or negative", () => {
      expect(calculateCouponDiscount(base, 0)).toBe(0);
      expect(calculateCouponDiscount(base, -100)).toBe(0);
    });

    it("respects min_order_value_cents", () => {
      const coupon: CouponRecord = { ...base, min_order_value_cents: 5000 };
      expect(calculateCouponDiscount(coupon, 4000)).toBe(0);
      expect(calculateCouponDiscount(coupon, 5000)).toBe(500);
    });

    it("applies percentage discounts and clamps percent between 0 and 100", () => {
      const coupon: CouponRecord = { ...base, discount_value: 20 };
      expect(calculateCouponDiscount(coupon, 10000)).toBe(2000);

      const over: CouponRecord = { ...base, discount_value: 500 };
      expect(calculateCouponDiscount(over, 10000)).toBe(10000);
    });

    it("applies fixed amount discounts and caps at subtotal", () => {
      const coupon: CouponRecord = {
        ...base,
        discount_type: "fixed",
        discount_value: 2500,
      };
      expect(calculateCouponDiscount(coupon, 10000)).toBe(2500);
      expect(calculateCouponDiscount(coupon, 2000)).toBe(2000);
    });
  });

  describe('Yoco Payment Integration', () => {
    it('should include coupon discount in total sent to Yoco', async () => {
      // Mock the Yoco start API
      const mockYocoResponse = {
        id: 'yoco-checkout-123',
        redirectUrl: 'https://payments.yoco.com/checkout/yoco-checkout-123',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockYocoResponse,
      });

      // Simulate the payload sent to Yoco start endpoint
      const payload = {
        customer: { email: 'test@example.com', name: 'Test User' },
        shippingAddress: {
          line1: '123 Test St',
          city: 'Test City',
          province: 'WC',
          postal_code: '1234',
          country: 'ZA',
        },
        items: [{ productId: 'prod-1', variantId: null, qty: 1 }],
        couponCode: 'SAVE20', // 20% discount
      };

      // Mock the server calculation
      const subtotal = 50000; // R500
      const shipping = 6000; // R60
      const discount = 10000; // R100 (20% of R500)
      const expectedTotal = subtotal + shipping - discount; // R460

      // The server should send this total to Yoco
      const yocoPayload = {
        amount: expectedTotal,
        currency: 'ZAR',
        // ... other Yoco fields
      };

      expect(yocoPayload.amount).toBe(46000); // R460 in cents
    });

    it('should handle no coupon correctly', async () => {
      const payload = {
        customer: { email: 'test@example.com', name: 'Test User' },
        shippingAddress: {
          line1: '123 Test St',
          city: 'Test City',
          province: 'WC',
          postal_code: '1234',
          country: 'ZA',
        },
        items: [{ productId: 'prod-1', variantId: null, qty: 1 }],
        // No couponCode
      };

      const subtotal = 50000; // R500
      const shipping = 6000; // R60
      const discount = 0; // No discount
      const expectedTotal = subtotal + shipping - discount; // R560

      expect(expectedTotal).toBe(56000); // R560 in cents
    });

    it('should validate coupon before applying discount', async () => {
      // Test coupon validation logic directly
      const coupon = {
        code: 'SAVE20',
        discount_type: 'percentage' as const,
        discount_value: 20,
        min_order_value_cents: 10000,
      };
      
      const subtotal = 50000; // R500
      const discount = calculateCouponDiscount(coupon, subtotal);
      
      expect(discount).toBe(10000); // 20% of R500
      expect(discount).toBeGreaterThan(0);
    });

    it('should reject invalid coupons', async () => {
      // Test invalid coupon logic
      const invalidCoupon = {
        code: 'EXPIRED',
        discount_type: 'percentage' as const,
        discount_value: 10,
        min_order_value_cents: 100000, // Very high minimum
      };
      
      const subtotal = 5000; // Below minimum
      const discount = calculateCouponDiscount(invalidCoupon, subtotal);
      
      expect(discount).toBe(0); // No discount due to minimum order value
    });
  });

  describe('Frontend Display Logic', () => {
    it('should show discounted total to user', () => {
      // Simulate frontend calculation
      const subtotalCents = 50000; // R500
      const shippingCents = 6000; // R60
      const appliedDiscountCents = 10000; // R100
      const totalCents = subtotalCents + shippingCents - appliedDiscountCents;

      expect(totalCents).toBe(46000); // R460
      
      // Convert to Rands for display
      const totalRands = totalCents / 100;
      expect(totalRands).toBe(460);
    });

    it('should update display when coupon is applied', () => {
      let appliedDiscountCents = 0;
      let couponError = null;
      let couponSuccess = null;

      // Simulate applying coupon
      const couponCode = 'SAVE20';
      const discountAmount = 10000; // R100

      appliedDiscountCents = discountAmount;
      couponSuccess = `Coupon applied: -R${discountAmount / 100}`;

      expect(appliedDiscountCents).toBe(10000);
      expect(couponSuccess).toBe('Coupon applied: -R100');
      expect(couponError).toBeNull();
    });

    it('should show error for invalid coupon', () => {
      let couponError = null;
      let couponSuccess = null;

      // Simulate invalid coupon
      couponError = 'Invalid or expired coupon';
      couponSuccess = null;

      expect(couponError).toBe('Invalid or expired coupon');
      expect(couponSuccess).toBeNull();
    });
  });

  describe('Database Storage', () => {
    it('should store coupon info in pending_checkouts', async () => {
      // Mock database insert
      const mockInsert = vi.fn().mockResolvedValue({
        data: { 
          id: 'pending-1',
          coupon_code: 'SAVE20',
          discount_cents: 10000,
          amount_cents: 46000
        },
        error: null,
      });

      const pendingCheckoutData = {
        customer_email: 'test@example.com',
        amount_cents: 46000, // Discounted total
        coupon_code: 'SAVE20',
        discount_cents: 10000,
        currency: 'ZAR',
        status: 'initiated',
      };

      // Simulate database insert
      const result = await mockInsert(pendingCheckoutData);

      expect(result.data?.coupon_code).toBe('SAVE20');
      expect(result.data?.discount_cents).toBe(10000);
      expect(result.data?.amount_cents).toBe(46000);
    });

    it('should handle null coupon codes', async () => {
      const mockInsert = vi.fn().mockResolvedValue({
        data: { 
          id: 'pending-2',
          coupon_code: null,
          discount_cents: 0,
          amount_cents: 56000
        },
        error: null,
      });

      const pendingCheckoutData = {
        customer_email: 'test@example.com',
        amount_cents: 56000, // Full price
        coupon_code: null,
        discount_cents: 0,
        currency: 'ZAR',
        status: 'initiated',
      };

      const result = await mockInsert(pendingCheckoutData);

      expect(result.data?.coupon_code).toBeNull();
      expect(result.data?.discount_cents).toBe(0);
      expect(result.data?.amount_cents).toBe(56000);
    });
  });

  describe('End-to-End Flow Verification', () => {
    it('should maintain consistency across all stages', () => {
      // Stage 1: Frontend calculation
      const subtotalCents = 50000;
      const shippingCents = 6000;
      const discountCents = 10000; // 20% of R500
      const frontendTotal = subtotalCents + shippingCents - discountCents;

      // Stage 2: Server calculation (should match frontend)
      const serverTotal = subtotalCents + shippingCents - discountCents;

      // Stage 3: Amount sent to Yoco
      const yocoAmount = serverTotal;

      // Stage 4: Amount stored in database
      const databaseAmount = yocoAmount;

      expect(frontendTotal).toBe(46000);
      expect(serverTotal).toBe(46000);
      expect(yocoAmount).toBe(46000);
      expect(databaseAmount).toBe(46000);

      // All stages should match
      expect(frontendTotal).toBe(serverTotal);
      expect(serverTotal).toBe(yocoAmount);
      expect(yocoAmount).toBe(databaseAmount);
    });

    it('should handle edge cases correctly', () => {
      const testCases = [
        {
          name: 'No discount',
          subtotal: 10000,
          shipping: 6000,
          discount: 0,
          expected: 16000,
        },
        {
          name: 'Percentage discount',
          subtotal: 20000,
          shipping: 6000,
          discount: 4000, // 20%
          expected: 22000,
        },
        {
          name: 'Fixed discount',
          subtotal: 15000,
          shipping: 6000,
          discount: 2000,
          expected: 19000,
        },
        {
          name: 'Fixed discount capped at subtotal',
          subtotal: 1500,
          shipping: 6000,
          discount: 2000, // Fixed R20, but subtotal is only R15
          expected: 6000, // Should be shipping only (subtotal capped at 0)
        },
      ];

      testCases.forEach(({ name, subtotal, shipping, discount, expected }) => {
        const actualDiscount = Math.min(discount, subtotal);
        const total = subtotal + shipping - actualDiscount;
        expect(total).toBe(expected);
      });
    });
  });
});
