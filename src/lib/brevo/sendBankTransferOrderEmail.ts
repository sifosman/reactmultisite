import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatZar } from "@/lib/money/zar";

export async function sendBankTransferOrderEmail(orderId: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("Missing BREVO_API_KEY or BREVO_SENDER_EMAIL or BREVO_SENDER_NAME");
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,customer_email,customer_name,total_cents,shipping_cents,subtotal_cents,discount_cents,currency,status")
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
      <h2 style="margin:0 0 8px;">Order received - Bank Transfer</h2>
      <p style="margin:0 0 16px;">Thanks${order.customer_name ? `, ${escapeHtml(order.customer_name)}` : ""}! Your order has been received and is pending payment.</p>

      <div style="border:1px solid #eee;border-radius:10px;padding:16px;">
        <div style="color:#666;font-size:12px;">Order ID</div>
        <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;font-size:13px;">${escapeHtml(order.id)}</div>

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
          <div style="display:flex;justify-content:space-between;font-size:16px;margin-top:10px;">
            <span><strong>Total</strong></span>
            <span><strong>${formatZar(order.total_cents)}</strong></span>
          </div>
        </div>
      </div>

      <div style="margin-top:20px;border:1px solid #d1fae5;border-radius:10px;padding:16px;background:#ecfdf5;">
        <h3 style="margin:0 0 12px;color:#065f46;">Bank Transfer Details</h3>
        <div style="font-size:14px;line-height:1.6;">
          <div><strong>Account holder:</strong> S Kadwa</div>
          <div><strong>Account number:</strong> 9285283250</div>
          <div><strong>Bank:</strong> Absa</div>
          <div><strong>Account type:</strong> Savings</div>
          <div style="margin-top:12px;color:#065f46;"><strong>Please use your Order ID as the payment reference:</strong> ${escapeHtml(order.id)}</div>
        </div>
      </div>

      <p style="margin:16px 0 0;color:#666;font-size:12px;">Your order will be processed once payment is received. If you have any questions, reply to this email or WhatsApp us at 071 3456 393.</p>
    </div>
  `;

  // Send order email to customer only
  const customerEmail = (order.customer_email ?? "").trim().toLowerCase();
  if (!customerEmail) {
    throw new Error("Customer email is required");
  }

  const customerPayload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: customerEmail, name: order.customer_name ?? undefined }],
    subject: `Order received - Bank Transfer - Order ${order.id}`,
    htmlContent,
  };

  // Send customer order email
  const customerRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(customerPayload),
  });

  if (!customerRes.ok) {
    const text = await customerRes.text().catch(() => "");
    throw new Error(`Customer email send failed: ${customerRes.status} ${text}`);
  }

  // Send admin notification email
  await sendAdminNotification(order, items, apiKey, senderEmail, senderName);
}

async function sendAdminNotification(
  order: any,
  items: any[],
  apiKey: string,
  senderEmail: string,
  senderName: string
) {
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

  const adminHtmlContent = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
      <h2 style="margin:0 0 8px;">🔔 New Order Received - Bank Transfer</h2>
      <p style="margin:0 0 16px;">A new order has been placed and is awaiting payment.</p>

      <div style="border:1px solid #eee;border-radius:10px;padding:16px;">
        <div style="color:#666;font-size:12px;">Order ID</div>
        <div style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;font-size:13px;">${escapeHtml(order.id)}</div>
        
        <div style="margin-top:12px;">
          <div style="color:#666;font-size:12px;">Customer</div>
          <div style="font-size:14px;">
            <div><strong>${escapeHtml(order.customer_name || "N/A")}</strong></div>
            <div>${escapeHtml(order.customer_email)}</div>
            ${order.customer_phone ? `<div>${escapeHtml(order.customer_phone)}</div>` : ""}
          </div>
        </div>

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
          <div style="display:flex;justify-content:space-between;font-size:16px;margin-top:10px;">
            <span><strong>Total</strong></span>
            <span><strong>${formatZar(order.total_cents)}</strong></span>
          </div>
        </div>
      </div>

      <div style="margin-top:20px;">
        <a href="https://www.coastalwarehouse.co.za/admin" style="display:inline-block;background:#000;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">
          View Order in Admin Dashboard
        </a>
      </div>
    </div>
  `;

  const adminPayload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: "thecoastalwarehouse@gmail.com", name: "Coastal Warehouse Admin" }],
    subject: `🔔 New Order - ${order.customer_name || "Customer"} - Order ${order.id}`,
    htmlContent: adminHtmlContent,
  };

  const adminRes = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(adminPayload),
  });

  if (!adminRes.ok) {
    const text = await adminRes.text().catch(() => "");
    throw new Error(`Admin email send failed: ${adminRes.status} ${text}`);
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
