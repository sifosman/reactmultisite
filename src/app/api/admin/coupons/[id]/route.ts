import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();
    const body = await req.json();
    const { id } = await params;

    const {
      code,
      discount_type,
      discount_value,
      min_order_value_cents,
      max_uses,
      expires_at,
      active,
    } = body;

    const updateData: any = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (discount_type !== undefined) updateData.discount_type = discount_type;
    if (discount_value !== undefined) updateData.discount_value = discount_value;
    if (min_order_value_cents !== undefined) updateData.min_order_value_cents = min_order_value_cents;
    if (max_uses !== undefined) updateData.max_uses = max_uses;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from("coupons")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
