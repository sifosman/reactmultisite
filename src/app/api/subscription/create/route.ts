import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPayFastConfig, getPayFastBaseUrl, generatePayFastSignature } from "@/lib/payfast/client";

/**
 * Create a PayFast subscription checkout session
 * This is used for charging clients monthly for access to the platform
 */
export async function POST(req: Request) {
  const config = getPayFastConfig();
  
  if (!config) {
    return NextResponse.json(
      { error: "PayFast not configured" },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { planId, amount, itemName } = body;

  if (!planId || !amount || !itemName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // PayFast subscription data
  const paymentData: Record<string, string> = {
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    return_url: `${appUrl}/subscription/success`,
    cancel_url: `${appUrl}/subscription/cancel`,
    notify_url: `${appUrl}/api/subscription/webhook`,
    name_first: user.user_metadata?.name || "Customer",
    email_address: user.email || "",
    m_payment_id: `sub_${user.id}_${Date.now()}`,
    amount: amount.toFixed(2),
    item_name: itemName,
    item_description: `Monthly subscription - ${itemName}`,
    subscription_type: "1", // 1 = subscription
    billing_date: new Date().getDate().toString(),
    recurring_amount: amount.toFixed(2),
    frequency: "3", // 3 = Monthly
    cycles: "0", // 0 = Indefinite
  };

  // Generate signature
  const signature = generatePayFastSignature(paymentData, config.passphrase);
  paymentData.signature = signature;

  // Build form data for redirect
  const baseUrl = getPayFastBaseUrl(config.testMode);
  
  return NextResponse.json({
    url: baseUrl,
    data: paymentData,
  });
}
