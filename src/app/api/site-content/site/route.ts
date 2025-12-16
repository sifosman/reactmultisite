import { NextResponse } from "next/server";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export async function GET() {
  const supabase = await createPublicSupabaseServerClient();

  const { data, error } = await supabase
    .from("site_content")
    .select("key,data")
    .eq("key", "site")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data?.data ?? {} });
}
