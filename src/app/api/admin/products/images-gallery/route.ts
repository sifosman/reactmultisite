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

export async function GET() {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from("product_images")
    .select("url")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const urls = Array.from(new Set((data ?? []).map((row: any) => row.url).filter(Boolean)));

  return NextResponse.json({ images: urls.map((url) => ({ url })) });
}
