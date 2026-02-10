// Debug script to test Yoco webhook processing
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function debugYocoWebhook() {
  const supabaseAdmin = createSupabaseAdminClient();
  
  console.log("=== Yoco Webhook Debug ===");
  
  // 1. Check recent payment events
  const { data: paymentEvents, error: eventsError } = await supabaseAdmin
    .from("payment_events")
    .select("*")
    .eq("provider", "yoco")
    .order("created_at", { ascending: false })
    .limit(5);
    
  console.log("Payment Events:", paymentEvents);
  console.log("Events Error:", eventsError);
  
  // 2. Check pending checkouts
  const { data: pendingCheckouts, error: pendingError } = await supabaseAdmin
    .from("pending_checkouts")
    .select("*")
    .eq("status", "initiated")
    .order("created_at", { ascending: false })
    .limit(5);
    
  console.log("Pending Checkouts:", pendingCheckouts);
  console.log("Pending Error:", pendingError);
  
  // 3. Check recent orders
  const { data: recentOrders, error: ordersError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(10);
    
  console.log("Recent Orders:", recentOrders);
  console.log("Orders Error:", ordersError);
  
  // 4. Check Yoco payments
  const { data: yocoPayments, error: paymentsError } = await supabaseAdmin
    .from("payments")
    .select("*")
    .eq("provider", "yoco")
    .order("created_at", { ascending: false })
    .limit(5);
    
  console.log("Yoco Payments:", yocoPayments);
  console.log("Payments Error:", paymentsError);
}

// Run this in a Next.js API route or Node.js environment
export { debugYocoWebhook };
