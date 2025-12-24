import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import type { Theme } from "@/lib/config/site";

export async function GET() {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();

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
      { error: error.message || "Failed to fetch theme" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { theme } = body as { theme: Theme };

    if (!theme) {
      return NextResponse.json(
        { error: "Theme is required" },
        { status: 400 }
      );
    }

    const validThemes = ["default", "luxury", "minimal", "vibrant"];
    if (!validThemes.includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from("site_content")
      .upsert(
        {
          key: "theme_settings",
          data: {
            selectedTheme: theme,
            lastUpdated: new Date().toISOString(),
          },
        },
        {
          // Ensure we conflict on the logical key, not the generated id
          onConflict: "key",
        }
      );

    if (error) throw error;

    return NextResponse.json({ 
      success: true,
      theme 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update theme" },
      { status: 500 }
    );
  }
}
