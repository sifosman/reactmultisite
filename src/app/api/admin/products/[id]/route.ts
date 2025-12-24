import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productUpsertSchema } from "@/lib/admin/productSchemas";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { ok: false as const };
  }

  return { ok: true as const };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = productUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("products")
    .update({
      ...parsed.data,
      currency: "ZAR",
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const supabaseAdmin = createSupabaseAdminClient();

  // Do not allow deleting products that are referenced by order_items
  const { data: usedInOrders, error: orderItemsError } = await supabaseAdmin
    .from("order_items")
    .select("id")
    .eq("product_id", id)
    .limit(1);

  if (orderItemsError) {
    return NextResponse.json({ error: orderItemsError.message }, { status: 500 });
  }

  if ((usedInOrders ?? []).length > 0) {
    return NextResponse.json(
      { error: "Cannot delete this product because it appears in existing orders. You can set it to inactive instead." },
      { status: 400 }
    );
  }

  // Remove any category links first
  const { error: linkError } = await supabaseAdmin
    .from("product_categories")
    .delete()
    .eq("product_id", id);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
