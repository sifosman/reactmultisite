import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Try to get all tables using information_schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (error) {
      return NextResponse.json({ 
        error: "Failed to get tables", 
        details: error.message 
      }, { status: 500 });
    }
    
    // Get column info for each table
    const tablesWithColumns = [];
    
    for (const table of tables || []) {
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', table.table_name)
        .order('ordinal_position');
      
      tablesWithColumns.push({
        table_name: table.table_name,
        columns: columns || [],
        error: colError?.message || null
      });
    }
    
    return NextResponse.json({
      tables: tablesWithColumns
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: "Server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
