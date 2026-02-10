import type { Theme } from "@/lib/config/site";

export const dynamic = 'force-dynamic';

export async function getStoredTheme(): Promise<Theme> {
  // For now, always return default theme to avoid server-side rendering issues
  // TODO: Implement proper theme fetching with client-side loading
  return "default";
}
