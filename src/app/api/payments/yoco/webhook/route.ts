import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyYocoWebhook } from "@/lib/yoco/webhookVerify";
import { sendOrderPaidEmail } from "@/lib/brevo/sendOrderPaidEmail";
import { createOrderFromData } from "@/lib/checkout/createOrderFromData";
import { getEffectiveShippingCents } from "@/lib/shipping/getEffectiveShippingCents";

export async function POST(req: Request) {
  const rawBody = await req.text();

  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("YOCO_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "missing_webhook_secret" }, { status: 500 });
  }

  const verified = verifyYocoWebhook({
    rawBody,
    headers: req.headers,
    secret: webhookSecret,
  });

  if (!verified) {
    console.error("Yoco webhook verification failed", {
      webhookId: req.headers.get("webhook-id"),
      timestamp: req.headers.get("webhook-timestamp"),
      hasSignature: !!req.headers.get("webhook-signature")
    });
    return NextResponse.json({ error: "invalid_signature" }, { status: 403 });
  }

  const event = JSON.parse(rawBody) as {
    id: string;
    type: string;
    payload?: {
      id?: string;
      status?: string;
      metadata?: {
        checkoutId?: string;
        pendingCheckoutId?: string;
        existingOrderId?: string;
      };
      amount?: number;
      currency?: string;
    };
  };

  console.log("Yoco webhook received", {
    eventId: event.id,
    eventType: event.type,
    hasPayload: !!event.payload,
    payloadId: event.payload?.id,
    payloadStatus: event.payload?.status,
    metadataCheckoutId: event.payload?.metadata?.checkoutId,
    pendingCheckoutId: event.payload?.metadata?.pendingCheckoutId,
    existingOrderId: event.payload?.metadata?.existingOrderId,
    fullMetadata: JSON.stringify(event.payload?.metadata),
  });

  const eventJson = event as unknown as Record<string, unknown>;

  const supabaseAdmin = createSupabaseAdminClient();

  function findStringDeep(value: unknown, key: string, depth = 0): string | null {
    if (depth > 6) return null;
    if (!value || typeof value !== "object") return null;
    const obj = value as Record<string, unknown>;
    if (typeof obj[key] === "string") return obj[key] as string;
    for (const v of Object.values(obj)) {
      const found = findStringDeep(v, key, depth + 1);
      if (found) return found;
    }
    return null;
  }

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
    console.log("Yoco webhook event already processed", { eventId: event.id });
    return NextResponse.json({ ok: true });
  }

  if (insertEventError) {
    console.error("Failed to store Yoco webhook event", { eventId: event.id, error: insertEventError.message });
    return NextResponse.json({ error: insertEventError.message }, { status: 500 });
  }

  // Yoco puts the checkout ID in payload.metadata.checkoutId (per their docs).
  // payload.id is the event/payment ID, NOT the checkout ID.
  const yocoCheckoutId =
    event?.payload?.metadata?.checkoutId ??
    (eventJson ? findStringDeep(eventJson, "checkoutId") : null) ??
    event?.payload?.id;

  // Yoco metadata location can vary by event type; be defensive.
  const pendingCheckoutId =
    event?.payload?.metadata?.pendingCheckoutId ??
    (eventJson ? findStringDeep(eventJson, "pendingCheckoutId") : null);

  const existingOrderId =
    event?.payload?.metadata?.existingOrderId ??
    (eventJson ? findStringDeep(eventJson, "existingOrderId") : null);

  // Handle payment for existing pending_payment order
  if (existingOrderId && event.type === "payment.succeeded") {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id,status,user_id,customer_email,customer_name,customer_phone,total_cents,created_at")
      .eq("id", existingOrderId)
      .maybeSingle();

    if (order && order.status === "pending_payment") {
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", existingOrderId);

      // Match payment by checkout ID stored in provider_payment_id
      const matchCheckoutId =
        event?.payload?.metadata?.checkoutId ??
        (eventJson ? findStringDeep(eventJson, "checkoutId") : null) ??
        yocoCheckoutId;

      if (matchCheckoutId) {
        await supabaseAdmin
          .from("payments")
          .update({ status: "succeeded", raw_payload: eventJson })
          .eq("provider_payment_id", matchCheckoutId);
      }

      const { data: orderItems } = await supabaseAdmin
        .from("order_items")
        .select("product_id,variant_id,qty")
        .eq("order_id", existingOrderId);

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

      try {
        await sendOrderPaidEmail(existingOrderId);
      } catch {
        // Don't fail webhook if email fails
      }
    }

    return NextResponse.json({ ok: true });
  }

  let resolvedPendingCheckoutId = pendingCheckoutId;

  // If metadata didn't come through, try resolving via checkout_id.
  if (!resolvedPendingCheckoutId && typeof yocoCheckoutId === "string" && yocoCheckoutId) {
    const { data: pendingByCheckoutId } = await supabaseAdmin
      .from("pending_checkouts")
      .select("id")
      .eq("checkout_id", yocoCheckoutId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    resolvedPendingCheckoutId = pendingByCheckoutId?.id ?? null;
  }

  if (!resolvedPendingCheckoutId) {
    return NextResponse.json({ ok: true });
  }

  // Find pending checkout
  const { data: pendingCheckout, error: pendingCheckoutError } = await supabaseAdmin
    .from("pending_checkouts")
    .select("*")
    .eq("id", resolvedPendingCheckoutId)
    .eq("status", "initiated")
    .maybeSingle();

  if (pendingCheckoutError) {
    return NextResponse.json({ error: pendingCheckoutError.message }, { status: 500 });
  }

  if (!pendingCheckout) {
    return NextResponse.json({ ok: true });
  }

  if (event.type === "payment.succeeded") {
    const items = pendingCheckout.items as Array<{
      productId: string;
      variantId: string | null;
      qty: number;
    }>;

    const shippingAddress = pendingCheckout.shipping_address_snapshot as {
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
        userId: pendingCheckout.user_id,
        customer: {
          email: pendingCheckout.customer_email,
          name: pendingCheckout.customer_name,
          phone: pendingCheckout.customer_phone,
        },
        shippingAddress,
        items,
        shippingCents,
        status: "paid",
      });

      await supabaseAdmin.from("payments").insert({
        order_id: orderId,
        provider: "yoco",
        provider_payment_id: pendingCheckout.checkout_id,
        amount_cents: totalCents,
        currency: pendingCheckout.currency,
        status: "succeeded",
        raw_payload: eventJson,
      });

      await supabaseAdmin
        .from("pending_checkouts")
        .update({ status: "completed" })
        .eq("id", pendingCheckout.id);

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

      try {
        await sendOrderPaidEmail(orderId);
        console.log("Yoco order confirmation email sent", { orderId });
      } catch (emailError) {
        console.error("Yoco order confirmation email failed", {
          orderId,
          error: emailError instanceof Error ? emailError.message : "Unknown email error"
        });
        // Don't fail webhook delivery if email sending fails.
      }
    } catch (err) {
      console.error("Yoco order creation failed", {
        pendingCheckoutId: resolvedPendingCheckoutId,
        error: err instanceof Error ? err.message : "order_creation_failed",
        stack: err instanceof Error ? err.stack : undefined
      });
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "order_creation_failed" },
        { status: 500 }
      );
    }
  }

  if (event.type === "payment.failed") {
    await supabaseAdmin
      .from("pending_checkouts")
      .update({ status: "cancelled" })
      .eq("id", pendingCheckout.id);
  }

  return NextResponse.json({ ok: true });
}
