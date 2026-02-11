import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createOrderFromData } from "@/lib/checkout/createOrderFromData";
import { sendOrderPaidEmail } from "@/lib/brevo/sendOrderPaidEmail";
import { getEffectiveShippingCents } from "@/lib/shipping/getEffectiveShippingCents";

const finalizeSchema = z.object({
  pendingCheckoutId: z.string().uuid(),
});

/**
 * Fallback endpoint: creates the order when the webhook hasn't processed it.
 *
 * Yoco only redirects customers to the successUrl after a successful payment.
 * The user can only reach the success page (which calls this endpoint) if
 * Yoco confirmed the payment on their side. This endpoint is called by
 * YocoSuccessClient after a few polling attempts show no order was created
 * (meaning the webhook didn't fire or hasn't arrived yet).
 *
 * Safety:
 * - Idempotent: checks if order already exists before creating
 * - Only processes pending_checkouts that have a valid checkout_id
 * - Only processes pending_checkouts with status "initiated"
 * - Only processes checkouts created in the last 24 hours
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = finalizeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { pendingCheckoutId } = parsed.data;
  const supabaseAdmin = createSupabaseAdminClient();

  // 1. Load pending checkout
  const { data: pending, error: pendingError } = await supabaseAdmin
    .from("pending_checkouts")
    .select("*")
    .eq("id", pendingCheckoutId)
    .maybeSingle();

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  if (!pending) {
    return NextResponse.json({ error: "pending_checkout_not_found" }, { status: 404 });
  }

  // 2. If already completed, find and return the existing order
  if (pending.status === "completed") {
    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("order_id")
      .eq("provider", "yoco")
      .eq("provider_payment_id", pending.checkout_id)
      .maybeSingle();

    return NextResponse.json({
      status: "completed",
      orderId: existingPayment?.order_id ?? null,
    });
  }

  // 3. Must have a checkout_id (proves it was sent to Yoco)
  if (!pending.checkout_id) {
    return NextResponse.json(
      { error: "no_checkout_id", status: pending.status },
      { status: 400 }
    );
  }

  // 4. Only finalize "initiated" checkouts created within the last 24 hours
  if (pending.status !== "initiated") {
    return NextResponse.json({
      status: pending.status,
      error: "checkout_not_in_initiated_state",
    });
  }

  const createdAt = new Date(pending.created_at).getTime();
  const now = Date.now();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  if (now - createdAt > twentyFourHoursMs) {
    return NextResponse.json(
      { error: "checkout_expired", status: pending.status },
      { status: 400 }
    );
  }

  // 5. Double-check: maybe the webhook created the order between our check and now
  const { data: raceCheckPayment } = await supabaseAdmin
    .from("payments")
    .select("order_id")
    .eq("provider", "yoco")
    .eq("provider_payment_id", pending.checkout_id)
    .maybeSingle();

  if (raceCheckPayment?.order_id) {
    await supabaseAdmin
      .from("pending_checkouts")
      .update({ status: "completed" })
      .eq("id", pending.id)
      .eq("status", "initiated");

    return NextResponse.json({
      status: "completed",
      orderId: raceCheckPayment.order_id,
    });
  }

  // 6. Create the order (Yoco only redirects to successUrl on successful payment)
  console.log("Yoco finalize: creating order from pending checkout (webhook fallback)", {
    pendingCheckoutId,
    checkoutId: pending.checkout_id,
  });

  const items = pending.items as Array<{
    productId: string;
    variantId: string | null;
    qty: number;
  }>;

  const discountCents = Number((pending as { discount_cents?: number | null }).discount_cents ?? 0);

  const shippingAddress = pending.shipping_address_snapshot as {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  };

  try {
    const shippingCents = await getEffectiveShippingCents(shippingAddress.province);
    const { orderId, totalCents } = await createOrderFromData({
      userId: pending.user_id,
      customer: {
        email: pending.customer_email,
        name: pending.customer_name,
        phone: pending.customer_phone,
      },
      shippingAddress,
      items,
      shippingCents,
      discountCents,
      status: "paid",
    });

    // Record the payment
    await supabaseAdmin.from("payments").insert({
      order_id: orderId,
      provider: "yoco",
      provider_payment_id: pending.checkout_id,
      amount_cents: totalCents,
      currency: pending.currency,
      status: "succeeded",
      raw_payload: { source: "finalize_fallback", checkout_id: pending.checkout_id },
    });

    // Mark pending checkout as completed
    await supabaseAdmin
      .from("pending_checkouts")
      .update({ status: "completed" })
      .eq("id", pending.id);

    // Deduct stock
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("product_id,variant_id,qty")
      .eq("order_id", orderId);

    for (const item of (orderItems ?? []) as Array<{
      product_id: string;
      variant_id: string | null;
      qty: number;
    }>) {
      if (item.variant_id) {
        const { data: v } = await supabaseAdmin
          .from("product_variants")
          .select("id,stock_qty")
          .eq("id", item.variant_id)
          .maybeSingle();

        if (v) {
          await supabaseAdmin
            .from("product_variants")
            .update({ stock_qty: Math.max(0, (v.stock_qty ?? 0) - item.qty) })
            .eq("id", item.variant_id);
        }
      } else {
        const { data: p } = await supabaseAdmin
          .from("products")
          .select("id,stock_qty")
          .eq("id", item.product_id)
          .maybeSingle();

        if (p) {
          await supabaseAdmin
            .from("products")
            .update({ stock_qty: Math.max(0, (p.stock_qty ?? 0) - item.qty) })
            .eq("id", item.product_id);
        }
      }
    }

    // Send confirmation email
    try {
      await sendOrderPaidEmail(orderId);
      console.log("Yoco finalize: order confirmation email sent", { orderId });
    } catch (emailError) {
      console.error("Yoco finalize: order confirmation email failed", {
        orderId,
        error: emailError instanceof Error ? emailError.message : "Unknown email error",
      });
    }

    return NextResponse.json({
      status: "completed",
      orderId,
    });
  } catch (err) {
    console.error("Yoco finalize: order creation failed", {
      pendingCheckoutId,
      error: err instanceof Error ? err.message : "order_creation_failed",
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "order_creation_failed" },
      { status: 500 }
    );
  }
}
