import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateInvoiceTotals, formatZar } from "@/lib/invoice/calculateInvoiceTotals";

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
  
  const supabaseAdmin = createSupabaseAdminClient();
  
  if (!invoiceId) {
    // Return all recent invoices for testing
    const { data: invoices, error } = await supabaseAdmin
      .from("invoices")
      .select("id,invoice_number,subtotal_cents,delivery_cents,discount_cents,total_cents")
      .order("created_at", { ascending: false })
      .limit(5);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const testResults = [];
    for (const invoice of invoices ?? []) {
      // Get lines for this invoice
      const { data: lines } = await supabaseAdmin
        .from("invoice_lines")
        .select("id,qty,unit_price_cents,line_total_cents")
        .eq("invoice_id", invoice.id);
        
      const calculatedTotals = calculateInvoiceTotals(
        lines ?? [],
        invoice.delivery_cents,
        invoice.discount_cents
      );
      
      testResults.push({
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        stored_totals: {
          subtotal: formatZar(invoice.subtotal_cents),
          delivery: formatZar(invoice.delivery_cents),
          discount: formatZar(invoice.discount_cents),
          total: formatZar(invoice.total_cents)
        },
        calculated_totals: {
          subtotal: formatZar(calculatedTotals.subtotal_cents),
          delivery: formatZar(calculatedTotals.delivery_cents),
          discount: formatZar(calculatedTotals.discount_cents),
          total: formatZar(calculatedTotals.total_cents)
        },
        discrepancies: {
          subtotal_mismatch: invoice.subtotal_cents !== calculatedTotals.subtotal_cents,
          total_mismatch: invoice.total_cents !== calculatedTotals.total_cents,
          subtotal_diff: invoice.subtotal_cents - calculatedTotals.subtotal_cents,
          total_diff: invoice.total_cents - calculatedTotals.total_cents
        },
        line_count: lines?.length ?? 0
      });
    }
    
    return NextResponse.json({ test_results: testResults });
  }
  
  // Test specific invoice
  const [{ data: invoice, error: invErr }, { data: lines, error: linesErr }] = await Promise.all([
    supabaseAdmin
      .from("invoices")
      .select("id,invoice_number,subtotal_cents,delivery_cents,discount_cents,total_cents")
      .eq("id", invoiceId)
      .maybeSingle(),
    supabaseAdmin
      .from("invoice_lines")
      .select("id,qty,unit_price_cents,line_total_cents")
      .eq("invoice_id", invoiceId)
  ]);
  
  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  
  const calculatedTotals = calculateInvoiceTotals(
    lines ?? [],
    invoice.delivery_cents,
    invoice.discount_cents
  );
  
  return NextResponse.json({
    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      stored_totals: {
        subtotal: formatZar(invoice.subtotal_cents),
        delivery: formatZar(invoice.delivery_cents),
        discount: formatZar(invoice.discount_cents),
        total: formatZar(invoice.total_cents)
      }
    },
    lines: lines?.map(line => ({
      id: line.id,
      qty: line.qty,
      unit_price: formatZar(line.unit_price_cents),
      stored_line_total: formatZar(line.line_total_cents),
      calculated_line_total: formatZar(line.qty * line.unit_price_cents),
      line_total_mismatch: line.line_total_cents !== (line.qty * line.unit_price_cents)
    })),
    calculated_totals: {
      subtotal: formatZar(calculatedTotals.subtotal_cents),
      delivery: formatZar(calculatedTotals.delivery_cents),
      discount: formatZar(calculatedTotals.discount_cents),
      total: formatZar(calculatedTotals.total_cents)
    },
    discrepancies: {
      subtotal_mismatch: invoice.subtotal_cents !== calculatedTotals.subtotal_cents,
      total_mismatch: invoice.total_cents !== calculatedTotals.total_cents,
      subtotal_diff: invoice.subtotal_cents - calculatedTotals.subtotal_cents,
      total_diff: invoice.total_cents - calculatedTotals.total_cents
    }
  });
}
