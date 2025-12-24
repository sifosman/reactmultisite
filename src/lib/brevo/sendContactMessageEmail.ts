import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function sendContactMessageEmail(params: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("Missing BREVO_API_KEY or BREVO_SENDER_EMAIL or BREVO_SENDER_NAME");
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: admins, error: adminsError } = await supabaseAdmin
    .from("profiles")
    .select("email,full_name,role")
    .eq("role", "admin");

  if (adminsError) {
    throw new Error(adminsError.message);
  }

  const recipients: { email: string; name?: string }[] = [];

  for (const admin of admins ?? []) {
    const email = (admin.email ?? "").trim().toLowerCase();
    if (!email) continue;
    if (!recipients.some((r) => r.email === email)) {
      recipients.push({ email, name: (admin as any).full_name ?? undefined });
    }
  }

  if (recipients.length === 0) {
    // No admins configured; nothing to send.
    return;
  }

  const { name, email, phone, message } = params;

  const htmlContent = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111;">
      <h2 style="margin:0 0 8px;">New contact form message</h2>
      <p style="margin:0 0 12px;">Someone submitted the contact form on your store.</p>

      <div style="border:1px solid #eee;border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="margin-bottom:4px;"><strong>Name:</strong> ${escapeHtml(name)}</div>
        <div style="margin-bottom:4px;"><strong>Email:</strong> ${escapeHtml(email)}</div>
        ${phone ? `<div style="margin-bottom:4px;"><strong>Phone:</strong> ${escapeHtml(phone)}</div>` : ""}
      </div>

      <div style="border:1px solid #eee;border-radius:10px;padding:16px;white-space:pre-wrap;">
        ${escapeHtml(message)}
      </div>
    </div>
  `;

  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: recipients,
    subject: "New contact form message",
    htmlContent,
    replyTo: { email, name },
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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
