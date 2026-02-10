import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get all orders
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        customer_email,
        customer_phone,
        customer_name,
        status,
        subtotal_cents,
        shipping_cents,
        discount_cents,
        total_cents,
        currency,
        created_at
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Orders query error:", error);
      return NextResponse.json({ 
        error: "Failed to fetch orders", 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      orders: orders || [],
      count: orders?.length || 0
    });
    
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
