import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return { ok: false as const };

  return { ok: true as const };
}

export async function GET(req: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const invoiceId = url.searchParams.get("invoiceId");
  const testType = url.searchParams.get("testType") || "list";
  
  const supabaseAdmin = createSupabaseAdminClient();
  
  if (testType === "list" && !invoiceId) {
    // List recent invoices for testing
    const { data: invoices, error } = await supabaseAdmin
      .from("invoices")
      .select("id,invoice_number,status,customer_snapshot,created_at")
      .order("created_at", { ascending: false })
      .limit(5);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: "Recent invoices for testing",
      invoices: invoices?.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        status: inv.status,
        customer_name: (inv.customer_snapshot as any)?.name || 'No customer',
        created_at: inv.created_at,
        test_url: `/api/debug/test-invoice-editing?testType=details&invoiceId=${inv.id}`
      }))
    });
  }
  
  if (testType === "details" && invoiceId) {
    // Get invoice details with lines
    const [{ data: invoice, error: invErr }, { data: lines, error: linesErr }] = await Promise.all([
      supabaseAdmin
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .maybeSingle(),
      supabaseAdmin
        .from("invoice_lines")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("id", { ascending: true })
    ]);
    
    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
    if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    
    return NextResponse.json({
      invoice,
      lines,
      editable: invoice.status !== "cancelled",
      test_operations: [
        {
          name: "Update Quantity",
          method: "PATCH",
          url: `/api/admin/invoices/${invoiceId}/lines/[lineId]`,
          body: { qty: 2 }
        },
        {
          name: "Update Price", 
          method: "PATCH",
          url: `/api/admin/invoices/${invoiceId}/lines/[lineId]`,
          body: { unit_price_cents: 15000 }
        },
        {
          name: "Delete Line",
          method: "DELETE", 
          url: `/api/admin/invoices/${invoiceId}/lines/[lineId]`
        }
      ]
    });
  }
  
  return NextResponse.json({ error: "Invalid test type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  
  const url = new URL(req.url);
  const invoiceId = url.searchParams.get("invoiceId");
  const lineId = url.searchParams.get("lineId");
  const operation = url.searchParams.get("operation");
  
  if (!invoiceId || !lineId || !operation) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }
  
  const supabaseAdmin = createSupabaseAdminClient();
  
  try {
    let body = {};
    
    switch (operation) {
      case "quantity":
        const qty = Math.floor(Math.random() * 5) + 1; // Random 1-5
        body = { qty };
        break;
      case "price":
        const price = (Math.floor(Math.random() * 20) + 5) * 1000; // Random R5-R25
        body = { unit_price_cents: price };
        break;
      case "both":
        body = {
          qty: Math.floor(Math.random() * 3) + 1,
          unit_price_cents: (Math.floor(Math.random() * 15) + 10) * 1000
        };
        break;
      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    const response = await fetch(`${siteUrl}/api/admin/invoices/${invoiceId}/lines/${lineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      operation,
      body_sent: body,
      response: result
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
