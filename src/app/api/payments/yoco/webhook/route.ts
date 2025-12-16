import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyYocoWebhook } from "@/lib/yoco/webhookVerify";
import { sendOrderPaidEmail } from "@/lib/brevo/sendOrderPaidEmail";
import { upsertCustomerFromOrder } from "@/lib/customers/upsertCustomerFromOrder";

export async function POST(req: Request) {
  const rawBody = await req.text();

  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "missing_webhook_secret" }, { status: 500 });
  }

  const verified = verifyYocoWebhook({
    rawBody,
    headers: req.headers,
    secret: webhookSecret,
  });

  if (!verified) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 403 });
  }

  const event = JSON.parse(rawBody) as {
    id: string;
    type: string;
    payload?: {
      status?: string;
      metadata?: { checkoutId?: string };
      amount?: number;
      currency?: string;
    };
  };

  const eventJson = event as unknown as Record<string, unknown>;

  const supabaseAdmin = createSupabaseAdminClient();

  // Idempotency: store event id once
  const { error: insertEventError } = await supabaseAdmin
    .from("payment_events")
    .insert({
      provider: "yoco",
      provider_event_id: event.id,
      raw_payload: eventJson,
    });

  // If already processed, return OK
  if (insertEventError && insertEventError.message.toLowerCase().includes("duplicate")) {
    return NextResponse.json({ ok: true });
  }

  if (insertEventError) {
    return NextResponse.json({ error: insertEventError.message }, { status: 500 });
  }

  const checkoutId = event?.payload?.metadata?.checkoutId;

  if (!checkoutId) {
    return NextResponse.json({ ok: true });
  }

  // Find payment by checkout id
  const { data: payment, error: paymentLookupError } = await supabaseAdmin
    .from("payments")
    .select("id,order_id,status")
    .eq("provider", "yoco")
    .eq("provider_payment_id", checkoutId)
    .maybeSingle();

  if (paymentLookupError) {
    return NextResponse.json({ error: paymentLookupError.message }, { status: 500 });
  }

  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  if (event.type === "payment.succeeded") {
    await supabaseAdmin
      .from("payments")
      .update({
        status: "succeeded",
        raw_payload: eventJson,
      })
      .eq("id", payment.id);

    await supabaseAdmin
      .from("orders")
      .update({ status: "paid" })
      .eq("id", payment.order_id);

    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("product_id,variant_id,qty")
      .eq("order_id", payment.order_id);

    for (const item of (items ?? []) as Array<{ product_id: string; variant_id: string | null; qty: number }>) {
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

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("user_id,customer_email,customer_name,customer_phone,total_cents,created_at")
      .eq("id", payment.order_id)
      .maybeSingle();

    if (order) {
      try {
        await upsertCustomerFromOrder({
          user_id: order.user_id,
          customer_email: order.customer_email,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          total_cents: order.total_cents,
          created_at: order.created_at,
          isPaid: true,
        });
      } catch {
        // Don't fail webhook if customer upsert fails.
      }
    }

    try {
      await sendOrderPaidEmail(payment.order_id);
    } catch {
      // Don't fail webhook delivery if email sending fails.
    }
  }

  if (event.type === "payment.failed") {
    await supabaseAdmin
      .from("payments")
      .update({
        status: "failed",
        raw_payload: eventJson,
      })
      .eq("id", payment.id);
  }

  return NextResponse.json({ ok: true });
}
