import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    console.log("=== Database Debug Started ===");
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log("Supabase URL:", supabaseUrl ? "SET" : "NOT SET");
    console.log("Supabase Anon Key:", supabaseAnonKey ? "SET" : "NOT SET");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        error: "Missing environment variables", 
        details: {
          supabaseUrl: supabaseUrl ? "SET" : "NOT SET",
          supabaseAnonKey: supabaseAnonKey ? "SET" : "NOT SET"
        }
      }, { status: 500 });
    }
    
    console.log("Creating Supabase client...");
    const supabase = await createSupabaseServerClient();
    console.log("Supabase client created successfully");
    
    // Test database connection with products table
    console.log("Testing products table...");
    const { data: tables, error } = await supabase
      .from("products")
      .select("id")
      .limit(1);
    
    console.log("Products query result:", { error: error?.message, dataCount: tables?.length });
    
    if (error) {
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: error.message,
        code: error.code,
        hint: error.hint,
        errorDetails: error.details
      }, { status: 500 });
    }
    
    // Check if orders table exists
    console.log("Testing orders table...");
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, customer_email, status, created_at")
      .limit(5);
    
    console.log("Orders query result:", { error: ordersError?.message, dataCount: orders?.length });
    
    return NextResponse.json({
      database: "connected",
      supabaseUrl: supabaseUrl,
      ordersTable: ordersError ? "not_found" : "found",
      ordersCount: orders?.length || 0,
      recentOrders: orders || [],
      ordersError: ordersError?.message || null,
      productsTest: tables?.length || 0
    });
    
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}
