import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ProvinceName =
  | "Western Cape"
  | "Eastern Cape"
  | "Northern Cape"
  | "Gauteng"
  | "KwaZulu-Natal"
  | "Limpopo"
  | "Mpumalanga"
  | "North West"
  | "Free State";

/**
 * Load the current delivery settings and compute the effective shipping cents
 * for a given province. Falls back to flat rate if per-province is disabled
 * or if the province has no specific rate.
 */
export async function getEffectiveShippingCents(province?: string | null): Promise<number> {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("delivery_settings")
    .select("id,mode,flat_rate_cents")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (settingsError || !settings) {
    // Fallback to 6000 cents (R60) if settings table is misconfigured
    return 6000;
  }

  const base = settings.flat_rate_cents ?? 0;

  if (settings.mode !== "per_province" || !province) {
    return base;
  }

  const normalizedProvince = province.trim();
  if (!normalizedProvince) {
    return base;
  }

  const { data: rateRow, error: rateError } = await supabaseAdmin
    .from("delivery_province_rates")
    .select("rate_cents")
    .eq("settings_id", settings.id)
    .ilike("province", normalizedProvince)
    .maybeSingle();

  if (rateError || !rateRow) {
    return base;
  }

  return rateRow.rate_cents ?? base;
}
