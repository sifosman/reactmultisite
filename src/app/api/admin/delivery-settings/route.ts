import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const { data: settings, error: settingsError } = await supabase
    .from("delivery_settings")
    .select("id,mode,flat_rate_cents")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (settingsError || !settings) {
    return NextResponse.json(
      {
        mode: "flat",
        flatRateCents: 6000,
        provinces: [],
      },
      { status: 200 }
    );
  }

  const { data: provinceRows, error: provinceError } = await supabase
    .from("delivery_province_rates")
    .select("province,rate_cents")
    .eq("settings_id", settings.id)
    .order("province", { ascending: true });

  if (provinceError) {
    return NextResponse.json(
      { error: provinceError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    mode: settings.mode,
    flatRateCents: settings.flat_rate_cents,
    provinces: (provinceRows ?? []).map((r) => ({
      province: r.province,
      rateCents: r.rate_cents,
    })),
  });
}

export async function PUT(req: Request) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const mode = body.mode as "flat" | "per_province";
  const flatRateCents = Number(body.flatRateCents) || 0;
  const provinces = (body.provinces ?? []) as Array<{
    province: string;
    rateCents: number;
  }>;

  if (!mode || !["flat", "per_province"].includes(mode)) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }

  if (flatRateCents < 0) {
    return NextResponse.json({ error: "invalid_flat_rate" }, { status: 400 });
  }

  // Upsert single settings row
  const { data: existing, error: existingError } = await supabase
    .from("delivery_settings")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  let settingsId = existing?.id as string | undefined;

  if (!settingsId) {
    const { data: inserted, error: insertError } = await supabase
      .from("delivery_settings")
      .insert({ mode, flat_rate_cents: flatRateCents })
      .select("id")
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ error: insertError?.message ?? "settings_insert_failed" }, { status: 500 });
    }

    settingsId = inserted.id;
  } else {
    const { error: updateError } = await supabase
      .from("delivery_settings")
      .update({ mode, flat_rate_cents: flatRateCents })
      .eq("id", settingsId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  // Replace province rates for this settings row
  const { error: deleteError } = await supabase
    .from("delivery_province_rates")
    .delete()
    .eq("settings_id", settingsId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (provinces.length > 0) {
    const rows = provinces
      .filter((p) => p.province && p.rateCents >= 0)
      .map((p) => ({
        settings_id: settingsId,
        province: p.province,
        rate_cents: p.rateCents,
      }));

    if (rows.length > 0) {
      const { error: insertRatesError } = await supabase
        .from("delivery_province_rates")
        .insert(rows);

      if (insertRatesError) {
        return NextResponse.json({ error: insertRatesError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
