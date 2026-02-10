import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // Simulate admin user authentication
    const adminUserId = '1a751094-0cba-4219-b984-f71131f97e14';
    const adminEmail = 'thecoastalwarehouse@gmail.com';
    
    // Create a client with admin context
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'X-Admin-User-ID': adminUserId,
          'X-Admin-Email': adminEmail
        }
      }
    });
    
    // Test admin dashboard queries
    const [{ count: productsCount }, { count: ordersCount }, { data: recentOrders }] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id,status,customer_email,total_cents,created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
    
    // Calculate total revenue
    const totalRevenue = (recentOrders ?? []).reduce((sum, o) => sum + o.total_cents, 0);
    
    return NextResponse.json({
      adminAuth: {
        userId: adminUserId,
        email: adminEmail
      },
      dashboard: {
        totalRevenue: `R${(totalRevenue / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
        totalOrders: ordersCount?.toString() ?? "0",
        productsCount: productsCount?.toString() ?? "0",
        recentOrders: recentOrders || []
      },
      success: true
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
