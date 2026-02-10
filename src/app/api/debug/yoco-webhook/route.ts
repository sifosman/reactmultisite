import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabaseAdmin = createSupabaseAdminClient();
  
  const debug = {
    timestamp: new Date().toISOString(),
    payment_events: null as any,
    pending_checkouts: null as any,
    recent_orders: null as any,
    yoco_payments: null as any,
    errors: [] as string[]
  };
  
  try {
    // 1. Check recent payment events
    const { data: paymentEvents, error: eventsError } = await supabaseAdmin
      .from("payment_events")
      .select("provider, provider_event_id, created_at, raw_payload")
      .eq("provider", "yoco")
      .order("created_at", { ascending: false })
      .limit(5);
      
    if (eventsError) {
      debug.errors.push(`Payment events error: ${eventsError.message}`);
    } else {
      debug.payment_events = paymentEvents;
    }
    
    // 2. Check pending checkouts
    const { data: pendingCheckouts, error: pendingError } = await supabaseAdmin
      .from("pending_checkouts")
      .select("id, status, customer_email, total_cents, currency, created_at, checkout_id")
      .eq("status", "initiated")
      .order("created_at", { ascending: false })
      .limit(5);
      
    if (pendingError) {
      debug.errors.push(`Pending checkouts error: ${pendingError.message}`);
    } else {
      debug.pending_checkouts = pendingCheckouts;
    }
    
    // 3. Check recent orders
    const { data: recentOrders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, status, customer_email, total_cents, created_at")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(10);
      
    if (ordersError) {
      debug.errors.push(`Recent orders error: ${ordersError.message}`);
    } else {
      debug.recent_orders = recentOrders;
    }
    
    // 4. Check Yoco payments
    const { data: yocoPayments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("order_id, provider, status, amount_cents, created_at")
      .eq("provider", "yoco")
      .order("created_at", { ascending: false })
      .limit(5);
      
    if (paymentsError) {
      debug.errors.push(`Yoco payments error: ${paymentsError.message}`);
    } else {
      debug.yoco_payments = yocoPayments;
    }
    
  } catch (error) {
    debug.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return NextResponse.json(debug);
}
