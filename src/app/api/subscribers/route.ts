import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeString(value: string) {
  return value.trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const emailRaw = body?.email as string | undefined;
  const phoneRaw = body?.phone as string | undefined;
  const source = typeof body?.source === "string" ? (body.source as string) : "newsletter";

  if (!emailRaw && !phoneRaw) {
    return NextResponse.json({ error: "missing_contact" }, { status: 400 });
  }

  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const phone = phoneRaw ? normalizeString(phoneRaw) : null;

  const supabaseAdmin = createSupabaseAdminClient();

  const payload: Record<string, unknown> = { source };
  if (email) payload.email = email;
  if (phone) payload.phone = phone;

  const { error } = await supabaseAdmin
    .from("subscribers")
    .insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
