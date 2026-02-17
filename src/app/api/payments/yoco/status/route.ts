import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const statusSchema = z.object({
  pendingCheckoutId: z.string().uuid(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { pendingCheckoutId } = parsed.data;
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: pending, error: pendingError } = await supabaseAdmin
    .from("pending_checkouts")
    .select("id,checkout_id,status,customer_email,amount_cents,currency,created_at")
    .eq("id", pendingCheckoutId)
    .maybeSingle();

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  if (!pending) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  const { data: payment } = await supabaseAdmin
    .from("payments")
    .select("order_id,provider_payment_id,status,created_at")
    .eq("provider", "yoco")
    .eq("provider_payment_id", pending.checkout_id)
    .maybeSingle();

  const orderId = payment?.order_id ?? null;

  if (!orderId) {
    return NextResponse.json({
      status: pending.status,
      pendingCheckout: {
        id: pending.id,
        status: pending.status,
        amount_cents: pending.amount_cents,
        currency: pending.currency,
      },
      order: null,
    });
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id,order_number,status,subtotal_cents,shipping_cents,discount_cents,total_cents,currency,customer_email,customer_name,customer_phone,shipping_address_snapshot,created_at")
    .eq("id", orderId)
    .maybeSingle();

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("id,qty,unit_price_cents_snapshot,title_snapshot,variant_snapshot")
    .eq("order_id", orderId);

  return NextResponse.json({
    status: pending.status,
    pendingCheckout: {
      id: pending.id,
      status: pending.status,
      amount_cents: pending.amount_cents,
      currency: pending.currency,
    },
    order: order
      ? {
          ...order,
          items: items ?? [],
        }
      : null,
  });
}
