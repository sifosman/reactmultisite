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
  
  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // Get invoice details
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
    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      subtotal_cents: invoice.subtotal_cents,
      total_cents: invoice.total_cents
    },
    lines: lines?.map(line => ({
      id: line.id,
      title_snapshot: line.title_snapshot,
      qty: line.qty,
      unit_price_cents: line.unit_price_cents,
      line_total_cents: line.line_total_cents
    })),
    test_info: {
      can_edit: invoice.status !== "cancelled",
      line_count: lines?.length || 0,
      delete_url_template: `/api/admin/invoices/${invoiceId}/lines/{lineId}`
    }
  });
}

export async function DELETE(req: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const invoiceId = url.searchParams.get("invoiceId");
  const lineId = url.searchParams.get("lineId");
  
  if (!invoiceId || !lineId) {
    return NextResponse.json({ error: "invoiceId and lineId required" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // Get invoice first
  const { data: invoice, error: invErr } = await supabaseAdmin
    .from("invoices")
    .select("id,status,delivery_cents,discount_cents")
    .eq("id", invoiceId)
    .maybeSingle();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "cancelled") return NextResponse.json({ error: "Invoice is cancelled" }, { status: 400 });

  // Get the line to be deleted
  const { data: currentLine, error: lineErr } = await supabaseAdmin
    .from("invoice_lines")
    .select("id,qty,product_id,variant_id")
    .eq("id", lineId)
    .eq("invoice_id", invoiceId)
    .maybeSingle();

  if (lineErr) return NextResponse.json({ error: lineErr.message }, { status: 500 });
  if (!currentLine) return NextResponse.json({ error: "Line not found" }, { status: 404 });

  console.log("Deleting line:", { invoiceId, lineId, currentLine });

  // Delete the line
  const { error: deleteErr } = await supabaseAdmin
    .from("invoice_lines")
    .delete()
    .eq("id", lineId)
    .eq("invoice_id", invoiceId);

  if (deleteErr) {
    console.error("Delete line error:", deleteErr);
    return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  console.log("Line deleted successfully");

  // Recalculate totals
  const { data: remainingLines } = await supabaseAdmin
    .from("invoice_lines")
    .select("qty,unit_price_cents")
    .eq("invoice_id", invoiceId);

  const subtotal = (remainingLines ?? []).reduce((sum, line) => sum + (line.qty * line.unit_price_cents), 0);
  const delivery = invoice.delivery_cents ?? 0;
  const discount = invoice.discount_cents ?? 0;
  const total = Math.max(0, subtotal + delivery - discount);

  console.log("Recalculated totals:", { subtotal, delivery, discount, total });

  // Update invoice totals
  const { error: updateErr } = await supabaseAdmin
    .from("invoices")
    .update({
      subtotal_cents: subtotal,
      total_cents: total,
    })
    .eq("id", invoiceId);

  if (updateErr) {
    console.error("Update totals error:", updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  console.log("Invoice totals updated successfully");

  // Get updated invoice data
  const { data: updatedInvoice, error: fetchErr } = await supabaseAdmin
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  // Get updated lines
  const { data: updatedLines, error: updatedLinesErr } = await supabaseAdmin
    .from("invoice_lines")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("id", { ascending: true });

  if (updatedLinesErr) return NextResponse.json({ error: updatedLinesErr.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    message: "Line removed successfully",
    invoice: {
      ...updatedInvoice,
      lines: updatedLines ?? []
    },
    deleted_line_id: lineId,
    new_totals: {
      subtotal_cents: subtotal,
      total_cents: total
    }
  });
}
