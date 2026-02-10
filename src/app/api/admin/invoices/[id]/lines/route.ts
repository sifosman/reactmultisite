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

  // Get stock information for each line
  const linesWithStock = await Promise.all(
    (lines ?? []).map(async (line) => {
      let stock_qty = 0;
      
      if (line.variant_id) {
        // Get variant stock
        const { data: variant } = await supabaseAdmin
          .from("product_variants")
          .select("stock_qty")
          .eq("id", line.variant_id)
          .maybeSingle();
        stock_qty = variant?.stock_qty ?? 0;
      } else {
        // Get product stock
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("stock_qty")
          .eq("id", line.product_id)
          .maybeSingle();
        stock_qty = product?.stock_qty ?? 0;
      }

      return {
        ...line,
        stock_qty
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

const createLineSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid().nullable().optional(),
  qty: z.number().int().min(1),
  unit_price_cents: z.number().int().min(0),
  title_snapshot: z.string().min(1),
  variant_snapshot: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = createLineSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: invoice, error: invErr } = await supabaseAdmin
    .from("invoices")
    .select("id,status")
    .eq("id", id)
    .maybeSingle();

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (invoice.status === "cancelled") return NextResponse.json({ error: "invalid_status" }, { status: 400 });

  const lineTotal = parsed.data.qty * parsed.data.unit_price_cents;

  if (invoice.status === "issued") {
    // For issued invoices, check stock and handle accordingly
    let stock_qty = 0;
    
    if (parsed.data.variant_id) {
      const { data: variant } = await supabaseAdmin
        .from("product_variants")
        .select("stock_qty")
        .eq("id", parsed.data.variant_id)
        .maybeSingle();
      stock_qty = variant?.stock_qty ?? 0;
    } else {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("stock_qty")
        .eq("id", parsed.data.product_id)
        .maybeSingle();
      stock_qty = product?.stock_qty ?? 0;
    }

    if (parsed.data.qty > stock_qty) {
      return NextResponse.json({ error: "out_of_stock" }, { status: 400 });
    }

    // Insert the line
    const { error } = await supabaseAdmin.from("invoice_lines").insert({
      invoice_id: id,
      product_id: parsed.data.product_id,
      variant_id: parsed.data.variant_id ?? null,
      qty: parsed.data.qty,
      unit_price_cents: parsed.data.unit_price_cents,
      title_snapshot: parsed.data.title_snapshot,
      variant_snapshot: parsed.data.variant_snapshot,
      line_total_cents: lineTotal,
    });

    if (error) {
      const msg = error.message.includes("out_of_stock") ? "out_of_stock" : error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // TODO: Deduct stock for issued invoices (implement stock adjustment logic)
  } else {
    const { error } = await supabaseAdmin.from("invoice_lines").insert({
      invoice_id: id,
      product_id: parsed.data.product_id,
      variant_id: parsed.data.variant_id ?? null,
      qty: parsed.data.qty,
      unit_price_cents: parsed.data.unit_price_cents,
      title_snapshot: parsed.data.title_snapshot,
      variant_snapshot: parsed.data.variant_snapshot,
      line_total_cents: lineTotal,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Recalculate invoice totals
  const { data: allLines } = await supabaseAdmin
    .from("invoice_lines")
    .select("qty,unit_price_cents")
    .eq("invoice_id", id);

  const subtotal = (allLines ?? []).reduce((sum, line) => sum + (line.qty * line.unit_price_cents), 0);
  const delivery = 0; // Will be updated separately if needed
  const discount = 0; // Will be updated separately if needed
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
