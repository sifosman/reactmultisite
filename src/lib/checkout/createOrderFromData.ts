import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SHIPPING_CENTS } from "@/lib/money/zar";
import { upsertCustomerFromOrder } from "@/lib/customers/upsertCustomerFromOrder";

/**
 * Shared helper to create an order from validated checkout data.
 * Used by:
 * - Bank transfer flow (directly from checkout form)
 * - Yoco webhook (after payment.succeeded from pending_checkouts)
 */
export async function createOrderFromData({
  userId,
  customer,
  shippingAddress,
  items,
  shippingCents,
  discountCents = 0,
  status = "pending_payment",
}: {
  userId: string | null;
  customer: {
    email: string;
    name?: string | null;
    phone?: string | null;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  };
  items: Array<{
    productId: string;
    variantId: string | null;
    qty: number;
  }>;
  shippingCents?: number;
  discountCents?: number;
  status?: "pending_payment" | "paid";
}) {
  const supabaseAdmin = createSupabaseAdminClient();

  // Load authoritative pricing from DB
  const productIds = Array.from(new Set(items.map((i) => i.productId)));
  const variantIds = Array.from(
    new Set(items.map((i) => i.variantId).filter(Boolean))
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
            .select("id,product_id,sku,name,price_cents_override,stock_qty,attributes,active")
            .in("id", variantIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (productsError) {
    throw new Error(productsError.message);
  }
  if (variantsError) {
    throw new Error(variantsError.message);
  }

  const productsById = new Map<
    string,
    {
      id: string;
      name: string;
      price_cents: number;
      active: boolean;
      has_variants: boolean;
      stock_qty: number;
    }
  >();
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

  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product || !product.active) {
      throw new Error(`Product ${item.productId} not found or inactive`);
    }

    let unitPrice = product.price_cents;
    let variantSnapshot: Record<string, unknown> = {};

    if (item.variantId) {
      const variant = variantsById.get(item.variantId);
      if (!variant || !variant.active || variant.product_id !== product.id) {
        throw new Error(`Variant ${item.variantId} not found or inactive`);
      }

      if (variant.stock_qty < item.qty) {
        throw new Error(`Variant ${item.variantId} out of stock`);
      }

      unitPrice = variant.price_cents_override ?? product.price_cents;
      variantSnapshot = {
        sku: variant.sku,
        name: variant.name,
        attributes: variant.attributes,
      };
    } else {
      if (!product.has_variants && product.stock_qty < item.qty) {
        throw new Error(`Product ${item.productId} out of stock`);
      }
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
  const finalDiscountCents = Math.max(0, Math.min(discountCents, subtotalCents));
  const finalShippingCents = typeof shippingCents === "number" ? shippingCents : SHIPPING_CENTS;
  const totalCents = subtotalCents + finalShippingCents - finalDiscountCents;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      customer_email: customer.email,
      customer_phone: customer.phone ?? null,
      customer_name: customer.name ?? null,
      status,
      subtotal_cents: subtotalCents,
      shipping_cents: finalShippingCents,
      discount_cents: finalDiscountCents,
      total_cents: totalCents,
      currency: "ZAR",
      shipping_address_snapshot: shippingAddress,
    })
    .select("id,order_number,total_cents,created_at")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "order_create_failed");
  }

  const { error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  try {
    await upsertCustomerFromOrder({
      user_id: userId,
      customer_email: customer.email,
      customer_name: customer.name ?? null,
      customer_phone: customer.phone ?? null,
      total_cents: order.total_cents,
      created_at: order.created_at,
      isPaid: status === "paid",
    });
  } catch {
    // Do not fail order creation if customer upsert fails
  }

  return { orderId: order.id, totalCents: order.total_cents };
}
