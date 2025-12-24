import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatZar } from "@/lib/money/zar";

export async function sendOrderPaidEmail(orderId: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("Missing BREVO_API_KEY or BREVO_SENDER_EMAIL or BREVO_SENDER_NAME");
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,customer_email,customer_name,total_cents,shipping_cents,subtotal_cents,discount_cents,currency")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message);
  if (!order) throw new Error("Order not found");

  const { data: items, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select("id,qty,unit_price_cents_snapshot,title_snapshot,variant_snapshot")
    .eq("order_id", orderId);

  if (itemsError) throw new Error(itemsError.message);

  const itemRows = (items ?? [])
    .map((i) => {
      const lineTotal = i.unit_price_cents_snapshot * i.qty;
      const variant = (i.variant_snapshot ?? {}) as Record<string, unknown>;
      const variantName = typeof variant.name === "string" ? ` (${variant.name})` : "";
      return `
        <tr>
          <td style="padding:8px 0;">${escapeHtml(i.title_snapshot)}${escapeHtml(variantName)}</td>
          <td style="padding:8px 0;text-align:right;">${i.qty}</td>
          <td style="padding:8px 0;text-align:right;">${formatZar(i.unit_price_cents_snapshot)}</td>
          <td style="padding:8px 0;text-align:right;"><strong>${formatZar(lineTotal)}</strong></td>
        </tr>
      `;
    })
    .join("");

  const htmlContent = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
      <h2 style="margin:0 0 8px;">Payment received</h2>
      <p style="margin:0 0 16px;">Thanks${order.customer_name ? `, ${escapeHtml(order.customer_name)}` : ""}! Your payment was successful.</p>

      <div style="border:1px solid #eee;border-radius:10px;padding:16px;">
        <div style="color:#666;font-size:12px;">Order ID</div>
        <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;font-size:13px;">${escapeHtml(order.id)}</div>

        <table style="width:100%;margin-top:16px;border-collapse:collapse;">
          <thead>
            <tr style="border-bottom:1px solid #eee;">
              <th style="text-align:left;padding:8px 0;font-size:12px;color:#666;">Item</th>
              <th style="text-align:right;padding:8px 0;font-size:12px;color:#666;">Qty</th>
              <th style="text-align:right;padding:8px 0;font-size:12px;color:#666;">Unit</th>
              <th style="text-align:right;padding:8px 0;font-size:12px;color:#666;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="margin-top:16px;border-top:1px solid #eee;padding-top:12px;">
          <div style="display:flex;justify-content:space-between;font-size:14px;">
            <span style="color:#666;">Subtotal</span>
            <span>${formatZar(order.subtotal_cents)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-top:4px;">
            <span style="color:#666;">Shipping</span>
            <span>${formatZar(order.shipping_cents)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-top:4px;">
            <span style="color:#666;">Discount</span>
            <span>${formatZar(order.discount_cents)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:16px;margin-top:10px;">
            <span><strong>Total</strong></span>
            <span><strong>${formatZar(order.total_cents)}</strong></span>
          </div>
        </div>
      </div>

      <p style="margin:16px 0 0;color:#666;font-size:12px;">If you have any questions, reply to this email.</p>
    </div>
  `;

  // Build recipients: customer + all admin users with emails
  const recipients: { email: string; name?: string }[] = [];

  const customerEmail = (order.customer_email ?? "").trim().toLowerCase();
  if (customerEmail) {
    recipients.push({ email: customerEmail, name: order.customer_name ?? undefined });
  }

  const { data: admins, error: adminsError } = await supabaseAdmin
    .from("profiles")
    .select("email,full_name,role")
    .eq("role", "admin");

  if (adminsError) {
    throw new Error(adminsError.message);
  }

  for (const admin of admins ?? []) {
    const email = (admin.email ?? "").trim().toLowerCase();
    if (!email) continue;
    // Avoid sending duplicate email if admin email is same as customer
    if (email === customerEmail) continue;
    if (!recipients.some((r) => r.email === email)) {
      recipients.push({ email, name: (admin as any).full_name ?? undefined });
    }
  }

  if (recipients.length === 0) {
    // No valid recipients; nothing to send.
    return;
  }

  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: recipients,
    subject: `Payment received - Order ${order.id}`,
    htmlContent,
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Brevo send failed: ${res.status} ${text}`);
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
