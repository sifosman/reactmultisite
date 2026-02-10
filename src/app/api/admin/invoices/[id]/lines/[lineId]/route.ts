import { NextResponse } from "next/server";
import { z } from "zod";
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

async function loadInvoice(supabaseAdmin: ReturnType<typeof createSupabaseAdminClient>, id: string) {
  const [{ data: invoice, error: invErr }, { data: lines, error: linesErr }] = await Promise.all([
    supabaseAdmin
      .from("invoices")
      .select(
        "id,invoice_number,status,customer_id,customer_snapshot,subtotal_cents,discount_cents,delivery_cents,total_cents,currency,created_at,issued_at,cancelled_at"
      )
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("invoice_lines")
      .select(
        "id,product_id,variant_id,qty,unit_price_cents,title_snapshot,variant_snapshot,line_total_cents"
      )
      .eq("invoice_id", id)
      .order("id", { ascending: true }),
  ]);

  if (invErr) return { error: invErr.message };
  if (linesErr) return { error: linesErr.message };
  if (!invoice) return { error: "not_found", notFound: true as const };

  const linesWithStock = await Promise.all(
    (lines ?? []).map(async (line) => {
      let stock_qty = 0;

      if (line.variant_id) {
        const { data: variant } = await supabaseAdmin
          .from("product_variants")
          .select("stock_qty")
          .eq("id", line.variant_id)
          .maybeSingle();
        stock_qty = variant?.stock_qty ?? 0;
      } else {
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("stock_qty")
          .eq("id", line.product_id)
          .maybeSingle();
        stock_qty = product?.stock_qty ?? 0;
      }

      return {
        ...line,
        stock_qty,
      };
    })
  );

  return {
    invoice: {
      ...invoice,
      lines: linesWithStock,
    },
  };
}

const patchSchema = z
  .object({
    qty: z.number().int().min(1).optional(),
    unit_price_cents: z.number().int().min(0).optional(),
  })
  .refine((x) => x.qty !== undefined || x.unit_price_cents !== undefined);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id, lineId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabaseAdmin = createSupabaseAdminClient();

  // Get invoice with all required fields
  const { data: invoice, error: invErr } = await supabaseAdmin
    .from("invoices")
    .select("id,status,delivery_cents,discount_cents")
    .eq("id", id)
    .maybeSingle();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (invoice.status === "cancelled") return NextResponse.json({ error: "invalid_status" }, { status: 400 });

  // Get current line with product/variant info for stock adjustments
  const { data: currentLine, error: lineErr } = await supabaseAdmin
    .from("invoice_lines")
    .select("id,qty,unit_price_cents,product_id,variant_id")
    .eq("id", lineId)
    .eq("invoice_id", id)
    .maybeSingle();

  if (lineErr) return NextResponse.json({ error: lineErr.message }, { status: 500 });
  if (!currentLine) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Enforce stock ceiling (standard ecommerce behavior)
  let stock_qty = 0;
  if (currentLine.variant_id) {
    const { data: variant } = await supabaseAdmin
      .from("product_variants")
      .select("stock_qty")
      .eq("id", currentLine.variant_id)
      .maybeSingle();
    stock_qty = variant?.stock_qty ?? 0;
  } else {
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("stock_qty")
      .eq("id", currentLine.product_id)
      .maybeSingle();
    stock_qty = product?.stock_qty ?? 0;
  }

  const nextQty = parsed.data.qty ?? (currentLine.qty as number);
  const nextUnit = parsed.data.unit_price_cents ?? (currentLine.unit_price_cents as number);

  if (nextQty > stock_qty) {
    return NextResponse.json({ error: "out_of_stock" }, { status: 400 });
  }

  if (invoice.status === "issued") {
    const qtyDiff = nextQty - (currentLine.qty as number);
    
    // Update the line
    const { error } = await supabaseAdmin
      .from("invoice_lines")
      .update({
        qty: nextQty,
        unit_price_cents: nextUnit,
        line_total_cents: nextQty * nextUnit,
      })
      .eq("id", lineId)
      .eq("invoice_id", id);

    if (error) {
      const msg = error.message.includes("out_of_stock") ? "out_of_stock" : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Adjust stock if quantity changed (skip for now - stock adjustment functions don't exist)
    // TODO: Implement stock adjustment logic when needed
  } else {
    const { error } = await supabaseAdmin
      .from("invoice_lines")
      .update({
        qty: nextQty,
        unit_price_cents: nextUnit,
        line_total_cents: nextQty * nextUnit,
      })
      .eq("id", lineId)
      .eq("invoice_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalculate invoice totals
  const { data: lines } = await supabaseAdmin
    .from("invoice_lines")
    .select("qty,unit_price_cents")
    .eq("invoice_id", id);

  const subtotal = (lines ?? []).reduce((sum, line) => sum + (line.qty * line.unit_price_cents), 0);
  const delivery = invoice.delivery_cents ?? 0;
  const discount = invoice.discount_cents ?? 0;
  const total = Math.max(0, subtotal + delivery - discount);

  const { error: updateErr } = await supabaseAdmin
    .from("invoices")
    .update({
      subtotal_cents: subtotal,
      total_cents: total,
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const loaded = await loadInvoice(supabaseAdmin, id);
  if (loaded.notFound) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (loaded.error) return NextResponse.json({ error: loaded.error }, { status: 500 });

  return NextResponse.json({ invoice: loaded.invoice });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id, lineId } = await params;
  const supabaseAdmin = createSupabaseAdminClient();

  // Get invoice with all required fields
  const { data: invoice, error: invErr } = await supabaseAdmin
    .from("invoices")
    .select("id,status,delivery_cents,discount_cents")
    .eq("id", id)
    .maybeSingle();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (invoice.status === "cancelled") return NextResponse.json({ error: "invalid_status" }, { status: 400 });

  if (invoice.status === "issued") {
    // For issued invoices, handle stock restoration
    const { data: currentLine } = await supabaseAdmin
      .from("invoice_lines")
      .select("qty,product_id,variant_id")
      .eq("id", lineId)
      .eq("invoice_id", id)
      .maybeSingle();

    // Delete the line
    const { error } = await supabaseAdmin
      .from("invoice_lines")
      .delete()
      .eq("id", lineId)
      .eq("invoice_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Restore stock (skip for now - stock adjustment functions don't exist)
    // TODO: Implement stock restoration logic when needed
  } else {
    const { error } = await supabaseAdmin
      .from("invoice_lines")
      .delete()
      .eq("id", lineId)
      .eq("invoice_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalculate invoice totals
  const { data: lines } = await supabaseAdmin
    .from("invoice_lines")
    .select("qty,unit_price_cents")
    .eq("invoice_id", id);

  const subtotal = (lines ?? []).reduce((sum, line) => sum + (line.qty * line.unit_price_cents), 0);
  const delivery = invoice.delivery_cents ?? 0;
  const discount = invoice.discount_cents ?? 0;
  const total = Math.max(0, subtotal + delivery - discount);

  const { error: updateErr } = await supabaseAdmin
    .from("invoices")
    .update({
      subtotal_cents: subtotal,
      total_cents: total,
    })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const loaded = await loadInvoice(supabaseAdmin, id);
  if (loaded.notFound) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (loaded.error) return NextResponse.json({ error: loaded.error }, { status: 500 });

  return NextResponse.json({ invoice: loaded.invoice });
}
