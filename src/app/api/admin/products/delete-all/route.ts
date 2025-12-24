import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return { ok: false as const };

  return { ok: true as const };
}

// Bulk delete products that have never been used in any order_items.
export async function POST() {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // Find products with no order_items
  const { data: candidates, error: selectError } = await supabaseAdmin
    .from("products")
    .select("id")
    .not("id", "is", null)
    .filter("id", "in", `(${
      // note: we'll use a NOT EXISTS subquery instead in raw SQL; this placeholder will be ignored
      ""})`);

  // The Supabase JS filter API is awkward for NOT EXISTS; use a raw query via rpc or SQL
  // Instead we can fetch all product ids and then check order_items per product, but that could be slow.
  // To avoid complexity, we will just delete by server-side SQL using a Postgres function in the future.

  // Fallback: simple approach - load product ids and filter in JS.
  const { data: allProducts, error: allError } = await supabaseAdmin
    .from("products")
    .select("id");

  if (allError) {
    return NextResponse.json({ error: allError.message }, { status: 500 });
  }

  const productIds = (allProducts ?? []).map((p) => p.id as string);

  const deletableIds: string[] = [];

  for (const id of productIds) {
    const { data: orderItems, error: oiError } = await supabaseAdmin
      .from("order_items")
      .select("id")
      .eq("product_id", id)
      .limit(1);

    if (oiError) {
      return NextResponse.json({ error: oiError.message }, { status: 500 });
    }

    if (!orderItems || orderItems.length === 0) {
      deletableIds.push(id);
    }
  }

  if (deletableIds.length === 0) {
    return NextResponse.json({ deletedCount: 0 });
  }

  // Remove links and then products
  const { error: linkError } = await supabaseAdmin
    .from("product_categories")
    .delete()
    .in("product_id", deletableIds);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("products")
    .delete()
    .in("id", deletableIds);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ deletedCount: deletableIds.length });
}
