import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const {
      code,
      discount_type,
      discount_value,
      min_order_value_cents,
      max_uses,
      expires_at,
      active,
    } = body;

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json(
        { error: "Code, discount type, and discount value are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: code.toUpperCase(),
        discount_type,
        discount_value,
        min_order_value_cents: min_order_value_cents || null,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        active: active ?? true,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create coupon" },
      { status: 500 }
    );
  }
}
