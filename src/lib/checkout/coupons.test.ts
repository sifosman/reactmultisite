import { describe, it, expect } from "vitest";
import { calculateCouponDiscount, type CouponRecord } from "./coupons";

describe("calculateCouponDiscount", () => {
  const base: CouponRecord = {
    code: "SAVE",
    discount_type: "percentage",
    discount_value: 10,
    min_order_value_cents: null,
  };

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
