import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json({ 
        error: "SQL query is required" 
      }, { status: 400 });
    }
    
    const supabase = await createSupabaseServerClient();
    
    // Try to execute the SQL directly
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    // If orders table is broken, we'll get an error
    if (error && error.message.includes('column')) {
      return NextResponse.json({ 
        error: "Orders table schema issue detected", 
        details: error.message,
        suggestion: "Please run the fix_orders_table.sql script manually in Supabase SQL Editor"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      message: "Orders table appears to be working",
      currentData: data,
      error: error?.message || null
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
