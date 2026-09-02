import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendOrderPaidEmail } from "@/lib/brevo/sendOrderPaidEmail";

const schema = z.object({
  orderId: z.string().uuid(),
});

/**
 * Fallback endpoint for Flow 2 (paying an existing pending_payment order).
 *
 * Yoco only redirects customers to the successUrl after a successful payment.
 * If the webhook hasn't processed the payment yet, this endpoint marks the
 * order as paid and sends the confirmation email.
 *
 * Safety:
 * - Idempotent: if order is already "paid", returns success without re-sending email
 * - Only processes orders with status "pending_payment"
 * - Only processes payments with a valid provider_payment_id (checkout ID)
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { orderId } = parsed.data;
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,status,customer_email,total_cents,currency,created_at")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  // Already paid — webhook already processed it
  if (order.status === "paid") {
    return NextResponse.json({ status: "completed", orderId });
  }

  // Only finalize pending_payment orders
  if (order.status !== "pending_payment") {
    return NextResponse.json({
      status: order.status,
      error: "order_not_pending_payment",
    });
  }

  // Find the Yoco payment for this order
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .select("id,provider_payment_id,status")
    .eq("order_id", orderId)
    .eq("provider", "yoco")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  if (!payment || !payment.provider_payment_id) {
    return NextResponse.json(
      { error: "no_yoco_payment_found" },
      { status: 400 }
    );
  }

  // Mark order as paid
  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Update payment status
  await supabaseAdmin
    .from("payments")
    .update({ status: "succeeded" })
    .eq("id", payment.id);

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
    console.log("Yoco finalize-order: order confirmation email sent", { orderId });
  } catch (emailError) {
    console.error("Yoco finalize-order: order confirmation email failed", {
      orderId,
      error: emailError instanceof Error ? emailError.message : "Unknown email error",
    });
  }

  return NextResponse.json({ status: "completed", orderId });
}
