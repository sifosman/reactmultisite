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

  return {
    invoice: {
      ...invoice,
      lines: lines ?? [],
    },
  };
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const supabaseAdmin = createSupabaseAdminClient();

  const firstAttempt = await supabaseAdmin.rpc("issue_invoice", { p_invoice_id: id });

  if (firstAttempt.error) {
    const shouldRetryLegacyParam =
      firstAttempt.error.message.includes("schema cache") ||
      firstAttempt.error.message.includes("Could not find the function");

    if (shouldRetryLegacyParam) {
      const secondAttempt = await supabaseAdmin.rpc("issue_invoice", { invoice_id: id });
      if (secondAttempt.error) {
        const msg = secondAttempt.error.message.includes("out_of_stock")
          ? "out_of_stock"
          : secondAttempt.error.message;
        return NextResponse.json({ error: msg }, { status: 400 });
      }
    } else {
      const msg = firstAttempt.error.message.includes("out_of_stock")
        ? "out_of_stock"
        : firstAttempt.error.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const loaded = await loadInvoice(supabaseAdmin, id);
  if (loaded.notFound) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (loaded.error) return NextResponse.json({ error: loaded.error }, { status: 500 });

  return NextResponse.json({ invoice: loaded.invoice });
}
