import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/checkout/schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getEffectiveShippingCents } from "@/lib/shipping/getEffectiveShippingCents";

/**
 * Start a Yoco checkout WITHOUT creating an order first.
 * This stores a pending_checkout record and redirects to Yoco.
 * The order will be created by the webhook after payment.succeeded.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  const supabaseAdmin = createSupabaseAdminClient();

  // Get logged-in user (if any)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // Load products to compute the total amount
  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
  const variantIds = Array.from(
    new Set(input.items.map((i) => i.variantId).filter(Boolean))
  ) as string[];

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id,name,price_cents,active,has_variants,stock_qty")
        .in("id", productIds),
      variantIds.length
        ? supabaseAdmin
            .from("product_variants")
            .select("id,product_id,price_cents_override,stock_qty,active")
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
  (products ?? []).forEach((p) => productsById.set(p.id, p));

  const variantsById = new Map<string, { product_id: string; price_cents_override: number | null; active: boolean }>();
  (variants ?? []).forEach((v) => variantsById.set(v.id, v));

  // Compute total
  let subtotalCents = 0;
  for (const item of input.items) {
    const product = productsById.get(item.productId);
    if (!product || !product.active) {
      return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }

    let unitPrice = product.price_cents;

    if (item.variantId) {
      const variant = variantsById.get(item.variantId);
      if (!variant || !variant.active) {
        return NextResponse.json({ error: "invalid_variant" }, { status: 400 });
      }
      unitPrice = variant.price_cents_override ?? product.price_cents;
    }

    subtotalCents += unitPrice * item.qty;
  }

  const shippingCents = await getEffectiveShippingCents(input.shippingAddress.province);
  const totalCents = subtotalCents + shippingCents;

  // Create pending checkout record
  const { data: pendingCheckout, error: pendingError } = await supabaseAdmin
    .from("pending_checkouts")
    .insert({
      user_id: userId,
      customer_email: input.customer.email,
      customer_name: input.customer.name ?? null,
      customer_phone: input.customer.phone ?? null,
      shipping_address_snapshot: input.shippingAddress,
      items: input.items,
      amount_cents: totalCents,
      currency: "ZAR",
      status: "initiated",
    })
    .select("id")
    .single();

  if (pendingError || !pendingCheckout) {
    return NextResponse.json(
      { error: pendingError?.message ?? "pending_checkout_create_failed" },
      { status: 500 }
    );
  }

  // Call Yoco Create checkout API
  const yocoSecretKey = process.env.YOCO_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!yocoSecretKey) {
    return NextResponse.json({ error: "missing_yoco_secret_key" }, { status: 500 });
  }

  const createCheckoutRes = await fetch("https://payments.yoco.com/api/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${yocoSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: totalCents,
      currency: "ZAR",
      successUrl: `${siteUrl}/checkout/success?method=yoco`,
      cancelUrl: `${siteUrl}/checkout/cancelled`,
      failureUrl: `${siteUrl}/checkout/failed`,
      metadata: {
        pendingCheckoutId: pendingCheckout.id,
      },
    }),
  });

  const checkoutJson = await createCheckoutRes.json().catch(() => null);

  if (!createCheckoutRes.ok) {
    return NextResponse.json(
      { error: "yoco_checkout_create_failed", details: checkoutJson },
      { status: 502 }
    );
  }

  const checkoutId = checkoutJson?.id as string | undefined;
  const redirectUrl = checkoutJson?.redirectUrl as string | undefined;

  if (!checkoutId || !redirectUrl) {
    return NextResponse.json(
      { error: "yoco_invalid_response", details: checkoutJson },
      { status: 502 }
    );
  }

  // Save Yoco checkout ID on the pending checkout
  await supabaseAdmin
    .from("pending_checkouts")
    .update({ checkout_id: checkoutId })
    .eq("id", pendingCheckout.id);

  return NextResponse.json({ redirectUrl });
}
