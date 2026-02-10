import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Test creating a simple order
    const testOrder = {
      customer_email: "test@example.com",
      customer_name: "Test Customer",
      status: "pending",
      subtotal_cents: 10000,
      shipping_cents: 6000,
      total_cents: 16000,
      currency: "ZAR",
      items: [
        {
          product_id: "test-product-id",
          quantity: 1,
          unit_price_cents: 10000,
          total_cents: 10000
        }
      ]
    };
    
    // Try to insert the order
    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert(testOrder)
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json({ 
        error: "Failed to create order", 
        details: insertError.message,
        code: insertError.code
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
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
