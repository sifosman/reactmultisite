import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Test creating a simple order with correct schema
    const testOrder = {
      customer_email: "test@example.com",
      customer_name: "Test Customer",
      customer_phone: "0712345678",
      status: "pending_payment",
      subtotal_cents: 10000,
      shipping_cents: 6000,
      discount_cents: 0,
      total_cents: 16000,
      currency: "ZAR",
      shipping_address_snapshot: {
        city: "Test City",
        line1: "123 Test Street",
        country: "ZA",
        province: "Test Province",
        postal_code: "0001"
      }
    };
    
    console.log("Creating test order:", testOrder);
    
    // Try to insert the order
    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert(testOrder)
      .select()
      .single();
    
    console.log("Insert result:", { order, insertError });
    
    if (insertError) {
      return NextResponse.json({ 
        error: "Failed to create order", 
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        errorDetails: insertError.details
      }, { status: 500 });
    }
    
    // Try to query orders
    const { data: orders, error: queryError } = await supabase
      .from("orders")
      .select("id, customer_email, status, created_at")
      .limit(5);
    
    return NextResponse.json({
      success: true,
      createdOrder: order,
      allOrders: orders,
      queryError: queryError?.message || null
    });
    
  } catch (error) {
    console.error("Test order error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}
