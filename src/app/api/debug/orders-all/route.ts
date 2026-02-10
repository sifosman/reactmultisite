import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      return NextResponse.json({ 
        error: "Missing SUPABASE_SERVICE_ROLE_KEY" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Get all orders without RLS restrictions
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
      console.error("Orders query error (service role):", error);
      return NextResponse.json({ 
        error: "Failed to fetch orders", 
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      orders: orders || [],
      count: orders?.length || 0,
      usingServiceRole: true
    });
    
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
