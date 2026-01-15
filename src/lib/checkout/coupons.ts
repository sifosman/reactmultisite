export type CouponRecord = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number; // percentage (0-100) or cents depending on type
  min_order_value_cents: number | null;
};

export function calculateCouponDiscount(
  coupon: CouponRecord,
  subtotalCents: number
): number {
  if (subtotalCents <= 0) return 0;

  if (coupon.min_order_value_cents != null && subtotalCents < coupon.min_order_value_cents) {
    return 0;
  }

  if (coupon.discount_type === "percentage") {
    const pct = Math.max(0, Math.min(100, coupon.discount_value));
    return Math.floor((subtotalCents * pct) / 100);
  }

  // fixed amount in cents, cap at subtotal
  const fixed = Math.max(0, coupon.discount_value);
  return Math.min(fixed, subtotalCents);
}
