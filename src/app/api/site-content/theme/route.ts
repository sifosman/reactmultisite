import { NextResponse } from "next/server";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export async function GET() {
  try {
    const supabase = await createPublicSupabaseServerClient();

    const { data, error } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "theme_settings")
      .maybeSingle();

    if (error) throw error;

    const selectedTheme = (data?.data as any)?.selectedTheme || "default";

    return NextResponse.json({ 
      theme: selectedTheme,
      success: true 
    });
  } catch (error: any) {
    return NextResponse.json(
      { theme: "default", success: true },
      { status: 200 }
    );
  }
}
