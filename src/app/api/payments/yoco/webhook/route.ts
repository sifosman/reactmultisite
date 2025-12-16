import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyYocoWebhook } from "@/lib/yoco/webhookVerify";
import { sendOrderPaidEmail } from "@/lib/brevo/sendOrderPaidEmail";

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
