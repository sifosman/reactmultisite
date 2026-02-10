import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Test database connection
    const { data: tables, error } = await supabase
      .from("products")
      .select("id")
      .limit(1);
    
    if (error) {
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: error.message 
      }, { status: 500 });
    }
    
    // Check if orders table exists
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, customer_email, status, created_at")
      .limit(5);
    
    return NextResponse.json({
      database: "connected",
      ordersTable: ordersError ? "not_found" : "found",
      ordersCount: orders?.length || 0,
      recentOrders: orders || [],
      ordersError: ordersError?.message || null
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
