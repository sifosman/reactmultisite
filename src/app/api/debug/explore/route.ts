import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Try common table names
    const commonTables = ['products', 'orders', 'users', 'customers', 'profiles', 'categories', 'invoices'];
    const results: Record<string, any> = {};
    
    for (const tableName of commonTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);
        
        results[tableName] = {
          exists: !error,
          columns: data && data.length > 0 ? Object.keys(data[0]) : [],
          error: error?.message || null,
          sampleData: data || null
        };
      } catch (e) {
        results[tableName] = {
          exists: false,
          error: e instanceof Error ? e.message : "Unknown error"
        };
      }
    }
    
    return NextResponse.json({
      results
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
