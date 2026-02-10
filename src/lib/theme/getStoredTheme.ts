import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import type { Theme } from "@/lib/config/site";

export const dynamic = 'force-dynamic';

export async function getStoredTheme(): Promise<Theme> {
  try {
    const supabase = await createPublicSupabaseServerClient();
    
    const { data, error } = await supabase
      .from("site_content")
      .select("data")
      .eq("key", "theme_settings")
      .maybeSingle();

    if (error) {
      console.warn("Error fetching theme:", error);
      return "default";
    }

    const selectedTheme = (data?.data as any)?.selectedTheme;
    
    if (selectedTheme && ["default", "luxury", "minimal", "vibrant"].includes(selectedTheme)) {
      return selectedTheme as Theme;
    }

    return "default";
  } catch (error) {
    console.warn("Error in getStoredTheme:", error);
    return "default";
  }
}
