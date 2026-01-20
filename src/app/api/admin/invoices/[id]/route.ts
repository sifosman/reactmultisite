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
        "id,invoice_number,status,customer_id,customer_snapshot,subtotal_cents,discount_cents,total_cents,delivery_cents,currency,created_at,issued_at,cancelled_at,payment_status,payment_status_updated_at,fulfilment_status,fulfilment_status_updated_at"
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

  return {
    invoice: {
      ...invoice,
      lines: lines ?? [],
    },
  };
}

const patchSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  customer_snapshot: z.record(z.string(), z.unknown()).optional(),
  delivery_cents: z.number().int().min(0).optional(),
  payment_status: z.enum(["unpaid", "paid"]).optional(),
  fulfilment_status: z.enum(["pending", "dispatched"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const supabaseAdmin = createSupabaseAdminClient();

  const loaded = await loadInvoice(supabaseAdmin, id);
  if (loaded.notFound) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (loaded.error) return NextResponse.json({ error: loaded.error }, { status: 500 });

  return NextResponse.json({ invoice: loaded.invoice });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabaseAdmin = createSupabaseAdminClient();

  const patch: Record<string, unknown> = {};
  if (parsed.data.customer_id !== undefined) patch.customer_id = parsed.data.customer_id;
  if (parsed.data.customer_snapshot !== undefined) patch.customer_snapshot = parsed.data.customer_snapshot;
  if (parsed.data.delivery_cents !== undefined) patch.delivery_cents = parsed.data.delivery_cents;
  if (parsed.data.payment_status !== undefined) {
    patch.payment_status = parsed.data.payment_status;
    patch.payment_status_updated_at = new Date().toISOString();
  }
  if (parsed.data.fulfilment_status !== undefined) {
    patch.fulfilment_status = parsed.data.fulfilment_status;
    patch.fulfilment_status_updated_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin.from("invoices").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const loaded = await loadInvoice(supabaseAdmin, id);
  if (loaded.notFound) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (loaded.error) return NextResponse.json({ error: loaded.error }, { status: 500 });

  return NextResponse.json({ invoice: loaded.invoice });
}
