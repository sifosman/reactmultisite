import { NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/checkout/schemas";
import { SHIPPING_CENTS } from "@/lib/money/zar";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  // If the user is logged in, associate the order with them.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id ?? null;

  // Load authoritative pricing from DB
  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
  const variantIds = Array.from(
    new Set(input.items.map((i) => i.variantId).filter(Boolean))
  ) as string[];

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id,name,price_cents,active")
        .in("id", productIds),
      variantIds.length
        ? supabaseAdmin
            .from("product_variants")
            .select("id,product_id,sku,name,price_cents_override,stock_qty,attributes,active")
            .in("id", variantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 500 });
  }
  if (variantsError) {
    return NextResponse.json({ error: variantsError.message }, { status: 500 });
  }

  const productsById = new Map<string, { id: string; name: string; price_cents: number; active: boolean }>();
  (products ?? []).forEach((p) => productsById.set(p.id, p));

  const variantsById = new Map<
    string,
    {
      id: string;
      product_id: string;
      sku: string;
      name: string | null;
      price_cents_override: number | null;
      stock_qty: number;
      attributes: unknown;
      active: boolean;
    }
  >();
  (variants ?? []).forEach((v) => variantsById.set(v.id, v));

  // Build order items with snapshots
  const orderItems: {
    product_id: string;
    variant_id: string | null;
    qty: number;
    unit_price_cents_snapshot: number;
    title_snapshot: string;
    variant_snapshot: Record<string, unknown>;
  }[] = [];

  for (const item of input.items) {
    const product = productsById.get(item.productId);
    if (!product || !product.active) {
      return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }

    let unitPrice = product.price_cents;
    let variantSnapshot: Record<string, unknown> = {};

    if (item.variantId) {
      const variant = variantsById.get(item.variantId);
      if (!variant || !variant.active || variant.product_id !== product.id) {
        return NextResponse.json({ error: "invalid_variant" }, { status: 400 });
      }

      if (variant.stock_qty < item.qty) {
        return NextResponse.json({ error: "out_of_stock" }, { status: 400 });
      }

      unitPrice = variant.price_cents_override ?? product.price_cents;
      variantSnapshot = {
        sku: variant.sku,
        name: variant.name,
        attributes: variant.attributes,
      };
    }

    orderItems.push({
      product_id: product.id,
      variant_id: item.variantId,
      qty: item.qty,
      unit_price_cents_snapshot: unitPrice,
      title_snapshot: product.name,
      variant_snapshot: variantSnapshot,
    });
  }

  const subtotalCents = orderItems.reduce(
    (sum, i) => sum + i.unit_price_cents_snapshot * i.qty,
    0
  );
  const discountCents = 0;
  const totalCents = subtotalCents + SHIPPING_CENTS - discountCents;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      customer_email: input.customer.email,
      customer_phone: input.customer.phone ?? null,
      customer_name: input.customer.name ?? null,
      status: "pending_payment",
      subtotal_cents: subtotalCents,
      shipping_cents: SHIPPING_CENTS,
      discount_cents: discountCents,
      total_cents: totalCents,
      currency: "ZAR",
      shipping_address_snapshot: input.shippingAddress,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? "order_create_failed" }, { status: 500 });
  }

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ orderId: order.id });
}
