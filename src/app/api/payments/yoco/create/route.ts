import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabaseAdmin = createSupabaseAdminClient();

  const body = await req.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;

  if (!orderId) {
    return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,status,total_cents,currency")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "order_not_payable" }, { status: 400 });
  }

  if (order.currency !== "ZAR") {
    return NextResponse.json({ error: "currency_not_supported" }, { status: 400 });
  }

  const yocoSecretKey = process.env.YOCO_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  if (!yocoSecretKey) {
    return NextResponse.json({ error: "missing_yoco_secret_key" }, { status: 500 });
  }

  // Create a payment record first (so we can reconcile webhooks)
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("payments")
    .insert({
      order_id: order.id,
      provider: "yoco",
      status: "initiated",
      amount_cents: order.total_cents,
      currency: "ZAR",
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: paymentError?.message ?? "payment_create_failed" },
      { status: 500 }
    );
  }

  const createCheckoutRes = await fetch("https://payments.yoco.com/api/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${yocoSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: order.total_cents,
      currency: "ZAR",
      successUrl: `${siteUrl}/checkout/success?orderId=${encodeURIComponent(order.id)}`,
      cancelUrl: `${siteUrl}/checkout/cancelled?orderId=${encodeURIComponent(order.id)}`,
      failureUrl: `${siteUrl}/checkout/failed?orderId=${encodeURIComponent(order.id)}`,
      metadata: {
        orderId: order.id,
        paymentId: payment.id,
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

  // Save checkout id on payment to match webhook events.
  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({ provider_payment_id: checkoutId })
    .eq("id", payment.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ redirectUrl });
}
