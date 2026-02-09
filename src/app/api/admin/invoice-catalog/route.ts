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
  if (!q) return NextResponse.json({ items: [] });

  const supabaseAdmin = createSupabaseAdminClient();

  // Split query into individual words for flexible matching
  const words = q.split(/\s+/).filter(word => word.length > 0);
  
  // Create search conditions for each word
  const productSearchConditions = words.map(word => 
    `(name.ilike.%${word}%,slug.ilike.%${word}%,description.ilike.%${word}%)`
  ).join(',');
  
  const variantSearchConditions = words.map(word => 
    `(sku.ilike.%${word}%,name.ilike.%${word}%)`
  ).join(',');

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id,name,slug,price_cents,has_variants,stock_qty,active,description")
        .or(productSearchConditions)
        .limit(30),
      supabaseAdmin
        .from("product_variants")
        .select("id,product_id,sku,name,price_cents_override,stock_qty,attributes,active")
        .or(variantSearchConditions)
        .limit(40),
    ]);

  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });
  if (variantsError) return NextResponse.json({ error: variantsError.message }, { status: 500 });

  const productsById = new Map(
    (products ?? []).map((p) => [p.id as string, p as any])
  );

  // Ensure we have product records for variants we found
  const variantProductIds = Array.from(new Set((variants ?? []).map((v) => v.product_id as string)));
  const missingProductIds = variantProductIds.filter((id) => !productsById.has(id));

  if (missingProductIds.length > 0) {
    const { data: moreProducts } = await supabaseAdmin
      .from("products")
      .select("id,name,slug,price_cents,has_variants,stock_qty,active,description")
      .in("id", missingProductIds);

    (moreProducts ?? []).forEach((p) => productsById.set(p.id as string, p as any));
  }

  const variantItems = (variants ?? [])
    .map((v: any) => {
      const p = productsById.get(v.product_id as string);
      if (!p) return null;

      const defaultUnit = (v.price_cents_override ?? p.price_cents) as number;

      return {
        kind: "variant" as const,
        product_id: p.id as string,
        variant_id: v.id as string,
        title: p.name as string,
        variant_name: v.name as string | null,
        sku: v.sku as string,
        stock_qty: v.stock_qty as number,
        unit_price_cents_default: defaultUnit,
        variant_snapshot: {
          sku: v.sku,
          name: v.name,
          attributes: v.attributes,
        },
      };
    })
    .filter(Boolean);

  const simpleItems = (products ?? [])
    .filter((p: any) => !p.has_variants)
    .map((p: any) => ({
      kind: "simple" as const,
      product_id: p.id as string,
      variant_id: null,
      title: p.name as string,
      variant_name: null,
      sku: null,
      stock_qty: p.stock_qty as number,
      unit_price_cents_default: p.price_cents as number,
      variant_snapshot: {},
    }));

  const items = [...variantItems, ...simpleItems].slice(0, 60);

  return NextResponse.json({ items });
}
