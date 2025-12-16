import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const emailRaw = body?.email as string | undefined;
  const source = typeof body?.source === "string" ? (body.source as string) : "newsletter";

  if (!emailRaw) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { error } = await supabaseAdmin
    .from("subscribers")
    .upsert({ email, source }, { onConflict: "email" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
