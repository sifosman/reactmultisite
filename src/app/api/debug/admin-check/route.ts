import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Check if admin user exists
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'thecoastalwarehouse@gmail.com')
      .eq('role', 'admin');
    
    if (error) {
      return NextResponse.json({ 
        error: "Failed to check admin user", 
        details: error.message 
      }, { status: 500 });
    }
    
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
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
    
    return NextResponse.json({
      adminUser: profiles?.[0] || null,
      adminExists: profiles && profiles.length > 0,
      orders: orders || [],
      ordersCount: orders?.length || 0,
      ordersError: ordersError?.message || null
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
