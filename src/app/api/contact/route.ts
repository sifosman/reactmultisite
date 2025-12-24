import { NextResponse } from "next/server";
import { sendContactMessageEmail } from "@/lib/brevo/sendContactMessageEmail";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const nameRaw = (body?.name as string | undefined) ?? "";
  const emailRaw = (body?.email as string | undefined) ?? "";
  const phoneRaw = (body?.phone as string | undefined) ?? "";
  const messageRaw = (body?.message as string | undefined) ?? "";

  const name = nameRaw.trim();
  const email = emailRaw.trim();
  const phone = phoneRaw.trim();
  const message = messageRaw.trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    await sendContactMessageEmail({ name, email, phone: phone || undefined, message });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to send contact email", err);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
