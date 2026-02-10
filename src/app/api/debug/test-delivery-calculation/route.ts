import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getEffectiveShippingCents } from "@/lib/shipping/getEffectiveShippingCents";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const province = url.searchParams.get("province");
  
  const supabaseAdmin = createSupabaseAdminClient();
  
  // Test delivery settings
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("delivery_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  
  // Test province rates
  const { data: provinceRates, error: ratesError } = await supabaseAdmin
    .from("delivery_province_rates")
    .select("*")
    .order("province", { ascending: true });
  
  // Test effective shipping calculation
  let effectiveShipping = 0;
  let shippingError = null;
  
  try {
    effectiveShipping = await getEffectiveShippingCents(province);
  } catch (error) {
    shippingError = error instanceof Error ? error.message : "Unknown error";
  }
  
  // Test some sample calculations
  const testProvinces = [
    "Western Cape",
    "Gauteng", 
    "KwaZulu-Natal",
    "Eastern Cape",
    "Invalid Province"
  ];
  
  const testResults = [];
  for (const testProvince of testProvinces) {
    try {
      const shipping = await getEffectiveShippingCents(testProvince);
      testResults.push({
        province: testProvince,
        shipping_cents: shipping,
        shipping_rands: (shipping / 100).toFixed(2)
      });
    } catch (error) {
      testResults.push({
        province: testProvince,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  
  return NextResponse.json({
    debug: {
      requested_province: province,
      effective_shipping_cents: effectiveShipping,
      effective_shipping_rands: (effectiveShipping / 100).toFixed(2),
      shipping_error: shippingError
    },
    delivery_settings: {
      settings,
      settings_error: settingsError?.message
    },
    province_rates: {
      rates: provinceRates,
      rates_error: ratesError?.message
    },
    test_calculations: testResults
  });
}
