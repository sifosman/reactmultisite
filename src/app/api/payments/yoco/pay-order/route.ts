import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const payOrderSchema = z.object({
  orderId: z.string().uuid(),
});

/**
 * Create a Yoco checkout for an existing pending_payment order.
 * Used when a user wants to pay for an order they already created (e.g. bank transfer that they want to convert to card payment).
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = payOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { orderId } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,user_id,status,total_cents,currency")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  if (order.status !== "pending_payment") {
    return NextResponse.json(
      { error: "order_already_paid_or_not_pending" },
      { status: 400 }
    );
  }

  const yocoSecretKey = process.env.YOCO_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
      amount: order.total_cents,
      currency: order.currency,
      successUrl: `${siteUrl}/account/orders/${orderId}?payment=success`,
      cancelUrl: `${siteUrl}/account/orders/${orderId}?payment=cancelled`,
      failureUrl: `${siteUrl}/account/orders/${orderId}?payment=failed`,
      metadata: {
        existingOrderId: orderId,
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

  await supabaseAdmin.from("payments").insert({
    order_id: orderId,
    provider: "yoco",
    provider_payment_id: checkoutId,
    amount_cents: order.total_cents,
    currency: order.currency,
    status: "pending",
    raw_payload: { checkout_id: checkoutId },
  });

  return NextResponse.json({ redirectUrl });
}
