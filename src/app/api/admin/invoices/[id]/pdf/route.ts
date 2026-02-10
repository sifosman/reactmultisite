import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

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
        "id,invoice_number,status,customer_snapshot,subtotal_cents,discount_cents,delivery_cents,total_cents,currency,created_at,issued_at"
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

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const rightEdge = pageWidth - margin;

  // Colors
  const black = rgb(0.1, 0.1, 0.1);
  const darkGray = rgb(0.3, 0.3, 0.3);
  const medGray = rgb(0.5, 0.5, 0.5);
  const lightGray = rgb(0.85, 0.85, 0.85);
  const accentColor = rgb(0.13, 0.55, 0.13); // Green accent
  const headerBg = rgb(0.96, 0.96, 0.96);

  let y = pageHeight - margin;

  // ── Try to embed logo ──
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoBytes = await fs.readFile(logoPath);
    const logoImage = await pdf.embedPng(logoBytes);
    const logoDims = logoImage.scale(0.5);
    const logoHeight = Math.min(logoDims.height, 50);
    const logoWidth = (logoDims.width / logoDims.height) * logoHeight;
    page.drawImage(logoImage, {
      x: margin,
      y: y - logoHeight,
      width: logoWidth,
      height: logoHeight,
    });
  } catch {
    // If logo fails, just draw company name as text
    page.drawText("Coastal Warehouse", { x: margin, y: y - 20, size: 22, font: fontBold, color: black });
  }

  // ── INVOICE title on the right ──
  page.drawText("INVOICE", { x: rightEdge - 120, y: y - 10, size: 26, font: fontBold, color: black });

  y -= 60;

  // ── Divider line ──
  page.drawLine({ start: { x: margin, y }, end: { x: rightEdge, y }, thickness: 2, color: black });

  y -= 24;

  // ── Invoice details row ──
  // Left: Company details
  page.drawText("Coastal Warehouse", { x: margin, y, size: 11, font: fontBold, color: black });
  y -= 15;
  page.drawText("Verulam, Durban, 4340", { x: margin, y, size: 9, font, color: darkGray });
  y -= 13;
  page.drawText("WhatsApp: 071 3456 393", { x: margin, y, size: 9, font, color: darkGray });
  y -= 13;
  page.drawText("thecoastalwarehouse@gmail.com", { x: margin, y, size: 9, font, color: darkGray });

  // Right: Invoice meta
  const metaX = 380;
  const metaValX = 460;
  const metaY = y + 41; // Align with company details start
  page.drawText("Invoice No:", { x: metaX, y: metaY, size: 9, font, color: medGray });
  page.drawText(invoice.invoice_number, { x: metaValX, y: metaY, size: 9, font: fontBold, color: black });

  page.drawText("Date:", { x: metaX, y: metaY - 15, size: 9, font, color: medGray });
  page.drawText(new Date(invoice.created_at).toLocaleDateString("en-ZA"), { x: metaValX, y: metaY - 15, size: 9, font, color: black });

  page.drawText("Status:", { x: metaX, y: metaY - 30, size: 9, font, color: medGray });
  const statusText = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
  page.drawText(statusText, { x: metaValX, y: metaY - 30, size: 9, font: fontBold, color: invoice.status === "issued" ? accentColor : black });

  if (invoice.issued_at) {
    page.drawText("Issued:", { x: metaX, y: metaY - 45, size: 9, font, color: medGray });
    page.drawText(new Date(invoice.issued_at).toLocaleDateString("en-ZA"), { x: metaValX, y: metaY - 45, size: 9, font, color: black });
  }

  y -= 40;

  // ── Thin divider ──
  page.drawLine({ start: { x: margin, y }, end: { x: rightEdge, y }, thickness: 0.5, color: lightGray });

  y -= 24;

  // ── Bill To section ──
  page.drawText("BILL TO", { x: margin, y, size: 9, font: fontBold, color: medGray });
  y -= 16;

  if (customerName) {
    page.drawText(customerName, { x: margin, y, size: 11, font: fontBold, color: black });
    y -= 15;
  }
  if (customerPhone) {
    page.drawText(customerPhone, { x: margin, y, size: 10, font, color: darkGray });
    y -= 14;
  }
  if (customerEmail) {
    page.drawText(customerEmail, { x: margin, y, size: 10, font, color: darkGray });
    y -= 14;
  }
  if (customerAddress) {
    const addrLines = customerAddress.split(/\r?\n/).slice(0, 4);
    for (const l of addrLines) {
      page.drawText(l, { x: margin, y, size: 10, font, color: darkGray });
      y -= 14;
    }
  }

  if (!customerName && !customerPhone && !customerEmail && !customerAddress) {
    page.drawText("Customer details not available", { x: margin, y, size: 10, font, color: medGray });
    y -= 14;
  }

  y -= 20;

  // ── Items table ──
  const colQtyX = margin;
  const colDescX = margin + 50;
  const colUnitX = 390;
  const colTotalX = rightEdge - 10;

  // Table header background
  page.drawRectangle({ x: margin - 6, y: y - 4, width: rightEdge - margin + 12, height: 20, color: headerBg });

  page.drawText("QTY", { x: colQtyX, y, size: 8, font: fontBold, color: medGray });
  page.drawText("DESCRIPTION", { x: colDescX, y, size: 8, font: fontBold, color: medGray });
  page.drawText("UNIT PRICE", { x: colUnitX, y, size: 8, font: fontBold, color: medGray });
  const totalHeader = "TOTAL";
  const totalHeaderWidth = fontBold.widthOfTextAtSize(totalHeader, 8);
  page.drawText(totalHeader, { x: colTotalX - totalHeaderWidth, y, size: 8, font: fontBold, color: medGray });

  y -= 20;

  // Table rows
  for (const l of lines ?? []) {
    const v = (l.variant_snapshot ?? {}) as Record<string, unknown>;
    const vName = typeof v.name === "string" && v.name ? ` (${v.name})` : "";
    const desc = `${l.title_snapshot}${vName}`;

    page.drawText(String(l.qty), { x: colQtyX, y, size: 10, font, color: black });
    page.drawText(desc.slice(0, 55), { x: colDescX, y, size: 10, font, color: black });
    page.drawText(formatZar(l.unit_price_cents), { x: colUnitX, y, size: 10, font, color: black });
    const totalText = formatZar(l.line_total_cents);
    const totalWidth = font.widthOfTextAtSize(totalText, 10);
    page.drawText(totalText, { x: colTotalX - totalWidth, y, size: 10, font, color: black });

    y -= 20;

    // Light row separator
    page.drawLine({ start: { x: margin - 6, y: y + 14 }, end: { x: rightEdge + 6, y: y + 14 }, thickness: 0.3, color: lightGray });

    if (y < 180) break;
  }

  y -= 16;

  // ── Totals section ──
  const totalsLabelX = 380;
  const totalsValueX = colTotalX;

  // Divider above totals
  page.drawLine({ start: { x: totalsLabelX - 10, y: y + 14 }, end: { x: rightEdge + 6, y: y + 14 }, thickness: 1, color: lightGray });

  // Subtotal
  page.drawText("Subtotal", { x: totalsLabelX, y, size: 10, font, color: darkGray });
  const subtotalText = formatZar(invoice.subtotal_cents);
  const subtotalWidth = font.widthOfTextAtSize(subtotalText, 10);
  page.drawText(subtotalText, { x: totalsValueX - subtotalWidth, y, size: 10, font, color: black });
  y -= 16;

  // Delivery
  const deliveryCents = invoice.delivery_cents ?? 0;
  page.drawText("Delivery", { x: totalsLabelX, y, size: 10, font, color: darkGray });
  const deliveryText = formatZar(deliveryCents);
  const deliveryWidth = font.widthOfTextAtSize(deliveryText, 10);
  page.drawText(deliveryText, { x: totalsValueX - deliveryWidth, y, size: 10, font, color: black });
  y -= 16;

  // Discount (only if > 0)
  if (invoice.discount_cents > 0) {
    page.drawText("Discount", { x: totalsLabelX, y, size: 10, font, color: darkGray });
    const discountText = `-${formatZar(invoice.discount_cents)}`;
    const discountWidth = font.widthOfTextAtSize(discountText, 10);
    page.drawText(discountText, { x: totalsValueX - discountWidth, y, size: 10, font, color: rgb(0.8, 0.2, 0.2) });
    y -= 16;
  }

  // Total line
  y -= 6;
  page.drawLine({ start: { x: totalsLabelX - 10, y: y + 16 }, end: { x: rightEdge + 6, y: y + 16 }, thickness: 1.5, color: black });
  page.drawText("TOTAL", { x: totalsLabelX, y, size: 12, font: fontBold, color: black });
  const totalAmtText = formatZar(invoice.total_cents);
  const totalAmtWidth = fontBold.widthOfTextAtSize(totalAmtText, 14);
  page.drawText(totalAmtText, { x: totalsValueX - totalAmtWidth, y: y - 1, size: 14, font: fontBold, color: black });

  // ── Banking Details section ──
  const bankY = 155;
  page.drawLine({ start: { x: margin, y: bankY + 16 }, end: { x: rightEdge, y: bankY + 16 }, thickness: 0.5, color: lightGray });

  page.drawText("BANKING DETAILS", { x: margin, y: bankY, size: 9, font: fontBold, color: medGray });

  const bankCol1X = margin;
  const bankCol2X = margin + 180;
  let bankRowY = bankY - 16;

  page.drawText("Account Holder:", { x: bankCol1X, y: bankRowY, size: 9, font, color: darkGray });
  page.drawText("S Kadwa", { x: bankCol1X + 90, y: bankRowY, size: 9, font: fontBold, color: black });
  page.drawText("Bank:", { x: bankCol2X, y: bankRowY, size: 9, font, color: darkGray });
  page.drawText("Absa", { x: bankCol2X + 90, y: bankRowY, size: 9, font: fontBold, color: black });
  bankRowY -= 14;

  page.drawText("Account No:", { x: bankCol1X, y: bankRowY, size: 9, font, color: darkGray });
  page.drawText("9285283250", { x: bankCol1X + 90, y: bankRowY, size: 9, font: fontBold, color: black });
  page.drawText("Account Type:", { x: bankCol2X, y: bankRowY, size: 9, font, color: darkGray });
  page.drawText("Savings", { x: bankCol2X + 90, y: bankRowY, size: 9, font: fontBold, color: black });
  bankRowY -= 14;

  page.drawText("Reference:", { x: bankCol1X, y: bankRowY, size: 9, font, color: darkGray });
  page.drawText(invoice.invoice_number, { x: bankCol1X + 90, y: bankRowY, size: 9, font: fontBold, color: accentColor });

  // ── Footer ──
  const footerY = 45;
  page.drawLine({ start: { x: margin, y: footerY + 12 }, end: { x: rightEdge, y: footerY + 12 }, thickness: 0.5, color: lightGray });
  page.drawText("Thank you for your business!", { x: margin, y: footerY, size: 9, font: fontBold, color: darkGray });
  page.drawText("For any queries, WhatsApp us at 071 3456 393", { x: margin, y: footerY - 13, size: 8, font, color: medGray });
  page.drawText("www.coastalwarehouse.co.za", { x: rightEdge - 130, y: footerY - 13, size: 8, font, color: medGray });

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
