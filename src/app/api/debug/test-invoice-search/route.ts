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

export async function GET(req: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ items: [], debug: "No query provided" });

  const supabaseAdmin = createSupabaseAdminClient();

  // Test basic product search first
  const { data: testProducts, error: testError } = await supabaseAdmin
    .from("products")
    .select("id,name,active")
    .limit(5);

  // Test the problematic search with simple ILIKE
  const { data: searchProducts, error: searchError } = await supabaseAdmin
    .from("products")
    .select("id,name,slug,price_cents,has_variants,stock_qty,active,description")
    .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
    .limit(10);

  // Test variant search
  const { data: searchVariants, error: variantError } = await supabaseAdmin
    .from("product_variants")
    .select("id,product_id,sku,name,price_cents_override,stock_qty,attributes,active")
    .or(`sku.ilike.%${q}%,name.ilike.%${q}%`)
    .limit(10);

  return NextResponse.json({
    debug: {
      query: q,
      testProducts,
      testError,
      searchProducts,
      searchError,
      searchVariants,
      variantError
    }
  });
}
