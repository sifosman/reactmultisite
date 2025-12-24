import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeString(value: string) {
  return value.trim();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const emailRaw = body?.email as string | undefined;
  const phoneRaw = body?.phone as string | undefined;
  const source = typeof body?.source === "string" ? (body.source as string) : "newsletter";

  if (!emailRaw && !phoneRaw) {
    return NextResponse.json({ error: "missing_contact" }, { status: 400 });
  }

  // Treat WhatsApp number or email as a generic contact string and
  // store it in the existing "email" column for backwards compatibility.
  const contact = normalizeString(phoneRaw || emailRaw || "");

  const supabaseAdmin = createSupabaseAdminClient();

  const { error } = await supabaseAdmin
    .from("subscribers")
    .upsert({ email: contact, source }, { onConflict: "email" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
