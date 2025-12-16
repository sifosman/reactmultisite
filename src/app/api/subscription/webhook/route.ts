import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getPayFastConfig } from "@/lib/payfast/client";

/**
 * PayFast ITN (Instant Transaction Notification) Webhook
 * Handles subscription payment notifications
 */
export async function POST(req: Request) {
  const config = getPayFastConfig();
  
  if (!config) {
    return NextResponse.json({ error: "PayFast not configured" }, { status: 500 });
  }

  // Parse form data from PayFast
  const formData = await req.formData();
  const data: Record<string, string> = {};
  
  formData.forEach((value, key) => {
    data[key] = value.toString();
  });

  // Validate the notification
  const paymentStatus = data.payment_status;
  const mPaymentId = data.m_payment_id;
  const pfPaymentId = data.pf_payment_id;
  const amountGross = data.amount_gross;

  // Log the webhook for debugging
  console.log("PayFast ITN received:", {
    paymentStatus,
    mPaymentId,
    pfPaymentId,
    amountGross,
  });

  // Extract user ID from m_payment_id (format: sub_userId_timestamp)
  const userId = mPaymentId?.split("_")[1];

  if (!userId) {
    console.error("Could not extract user ID from m_payment_id:", mPaymentId);
    return NextResponse.json({ error: "Invalid payment ID" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // Handle different payment statuses
  if (paymentStatus === "COMPLETE") {
    // Payment successful - update subscription status
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .upsert({
        user_id: userId,
        status: "active",
        payfast_payment_id: pfPaymentId,
        amount_cents: Math.round(parseFloat(amountGross) * 100),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    if (error) {
      console.error("Error updating subscription:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Subscription activated for user:", userId);
  } else if (paymentStatus === "CANCELLED") {
    // Subscription cancelled
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error cancelling subscription:", error);
    }

    console.log("Subscription cancelled for user:", userId);
  }

  // PayFast expects a 200 response
  return new NextResponse("OK", { status: 200 });
}
