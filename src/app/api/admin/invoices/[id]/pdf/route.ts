import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

function formatZar(cents: number) {
  return `R${(cents / 100).toFixed(2)}`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const supabaseAdmin = createSupabaseAdminClient();

  const [{ data: invoice, error: invErr }, { data: lines, error: linesErr }] = await Promise.all([
    supabaseAdmin
      .from("invoices")
      .select(
        "id,invoice_number,status,customer_snapshot,subtotal_cents,discount_cents,total_cents,currency,created_at,issued_at"
      )
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("invoice_lines")
      .select("id,qty,unit_price_cents,title_snapshot,variant_snapshot,line_total_cents")
      .eq("invoice_id", id)
      .order("id", { ascending: true }),
  ]);

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
  if (linesErr) return NextResponse.json({ error: linesErr.message }, { status: 500 });
  if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const snap = (invoice.customer_snapshot ?? {}) as Record<string, unknown>;
  const customerName = typeof snap.name === "string" ? snap.name : "";
  const customerPhone = typeof snap.phone === "string" ? snap.phone : "";
  const customerEmail = typeof snap.email === "string" ? snap.email : "";
  const customerAddress = typeof snap.address === "string" ? snap.address : "";

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let y = 841.89 - margin;

  page.drawText("Invoice", { x: margin, y, size: 20, font: fontBold, color: rgb(0, 0, 0) });
  y -= 28;

  page.drawText(`Number: ${invoice.invoice_number}`, { x: margin, y, size: 11, font });
  y -= 16;
  page.drawText(`Status: ${invoice.status}`, { x: margin, y, size: 11, font });
  y -= 16;
  page.drawText(`Date: ${new Date(invoice.created_at).toLocaleString("en-ZA")}`, { x: margin, y, size: 11, font });
  y -= 24;

  page.drawText("Bill To", { x: margin, y, size: 12, font: fontBold });
  y -= 16;
  if (customerName) {
    page.drawText(customerName, { x: margin, y, size: 11, font });
    y -= 14;
  }
  if (customerPhone) {
    page.drawText(customerPhone, { x: margin, y, size: 11, font });
    y -= 14;
  }
  if (customerEmail) {
    page.drawText(customerEmail, { x: margin, y, size: 11, font });
    y -= 14;
  }
  if (customerAddress) {
    const linesAddr = customerAddress.split(/\r?\n/).slice(0, 4);
    for (const l of linesAddr) {
      page.drawText(l, { x: margin, y, size: 11, font });
      y -= 14;
    }
  }

  y -= 10;

  page.drawText("Items", { x: margin, y, size: 12, font: fontBold });
  y -= 18;

  const colQtyX = margin;
  const colDescX = margin + 40;
  const colUnitX = 420;
  const colTotalX = 500;

  page.drawText("Qty", { x: colQtyX, y, size: 10, font: fontBold });
  page.drawText("Description", { x: colDescX, y, size: 10, font: fontBold });
  page.drawText("Unit", { x: colUnitX, y, size: 10, font: fontBold });
  page.drawText("Total", { x: colTotalX, y, size: 10, font: fontBold });
  y -= 14;

  for (const l of lines ?? []) {
    const v = (l.variant_snapshot ?? {}) as Record<string, unknown>;
    const vName = typeof v.name === "string" && v.name ? ` (${v.name})` : "";
    const desc = `${l.title_snapshot}${vName}`;

    page.drawText(String(l.qty), { x: colQtyX, y, size: 10, font });
    page.drawText(desc.slice(0, 50), { x: colDescX, y, size: 10, font });
    page.drawText(formatZar(l.unit_price_cents), { x: colUnitX, y, size: 10, font });
    page.drawText(formatZar(l.line_total_cents), { x: colTotalX, y, size: 10, font });

    y -= 14;
    if (y < 120) break;
  }

  y -= 18;

  page.drawText(`Subtotal: ${formatZar(invoice.subtotal_cents)}`, { x: colUnitX, y, size: 11, font });
  y -= 14;
  page.drawText(`Discount: ${formatZar(invoice.discount_cents)}`, { x: colUnitX, y, size: 11, font });
  y -= 14;
  page.drawText(`Total: ${formatZar(invoice.total_cents)}`, { x: colUnitX, y, size: 12, font: fontBold });

  const bytes = await pdf.save();
  const blob = new Blob([bytes.buffer as unknown as BlobPart], { type: "application/pdf" });

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"${invoice.invoice_number}.pdf\"`,
    },
  });
}
