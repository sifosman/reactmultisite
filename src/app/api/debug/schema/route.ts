import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get table information
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_info', { table_name: 'orders' });
    
    if (tablesError) {
      // Try alternative method to get table structure
      const { data: ordersSample, error: sampleError } = await supabase
        .from("orders")
        .select("*")
        .limit(1);
      
      return NextResponse.json({
        method: "sample_query",
        columns: ordersSample ? Object.keys(ordersSample[0] || {}) : [],
        sampleData: ordersSample,
        error: sampleError?.message || null
      });
    }
    
    return NextResponse.json({
      method: "rpc_call",
      tableInfo: tables
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
