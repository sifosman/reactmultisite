import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateCouponDiscount, type CouponRecord } from "@/lib/checkout/coupons";
import { getEffectiveShippingCents } from "@/lib/shipping/getEffectiveShippingCents";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const validateCouponSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable(),
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1),
  couponCode: z.string().trim().min(1).max(64),
  province: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = validateCouponSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const input = parsed.data;
  const supabaseAdmin = createSupabaseAdminClient();

  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
  const variantIds = Array.from(
    new Set(input.items.map((i) => i.variantId).filter(Boolean))
  ) as string[];

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id,price_cents,active")
        .in("id", productIds),
      variantIds.length
        ? supabaseAdmin
            .from("product_variants")
            .select("id,product_id,price_cents_override,active")
            .in("id", variantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }
  if (variantsError) {
    return NextResponse.json({ error: variantsError.message }, { status: 500 });
  }

  const productsById = new Map<string, { price_cents: number; active: boolean }>();
  (products ?? []).forEach((p) => productsById.set(p.id, { price_cents: p.price_cents, active: p.active }));

  const variantsById = new Map<
    string,
    { product_id: string; price_cents_override: number | null; active: boolean }
  >();
  (variants ?? []).forEach((v) =>
    variantsById.set(v.id, {
      product_id: v.product_id,
      price_cents_override: v.price_cents_override,
      active: v.active,
    })
  );

  let subtotalCents = 0;

  for (const item of input.items) {
    const product = productsById.get(item.productId);
    if (!product || !product.active) {
      return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }

    let unitPrice = product.price_cents;

    if (item.variantId) {
      const variant = variantsById.get(item.variantId);
      if (!variant || !variant.active || variant.product_id !== item.productId) {
        return NextResponse.json({ error: "invalid_variant" }, { status: 400 });
      }

      unitPrice = variant.price_cents_override ?? product.price_cents;
    }

    subtotalCents += unitPrice * item.qty;
  }

  const { data: coupon, error: couponError } = await supabaseAdmin
    .from("coupons")
    .select("code,discount_type,discount_value,min_order_value_cents,active,expires_at,usage_count,max_uses")
    .eq("code", input.couponCode.trim().toUpperCase())
    .maybeSingle();

  if (couponError) {
    return NextResponse.json({ error: "coupon_error" }, { status: 400 });
  }

  const now = new Date();
  const isExpired = coupon?.expires_at && new Date(coupon.expires_at) < now;
  const maxUsesReached =
    typeof coupon?.max_uses === "number" && coupon.max_uses > 0
      ? (coupon.usage_count ?? 0) >= coupon.max_uses
      : false;

  if (!coupon || !coupon.active || isExpired || maxUsesReached) {
    return NextResponse.json({ error: "invalid_coupon" }, { status: 400 });
  }

  const couponRecord: CouponRecord = {
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    min_order_value_cents: coupon.min_order_value_cents ?? null,
  };

  const discountCents = calculateCouponDiscount(couponRecord, subtotalCents);

  if (discountCents <= 0) {
    return NextResponse.json({ error: "coupon_not_applicable" }, { status: 400 });
  }

  const shippingCents = await getEffectiveShippingCents(input.province);
  const totalCents = subtotalCents + shippingCents - discountCents;

  return NextResponse.json({
    ok: true,
    coupon: { code: coupon.code, discountCents },
    subtotalCents,
    shippingCents,
    totalCents,
  });
}
