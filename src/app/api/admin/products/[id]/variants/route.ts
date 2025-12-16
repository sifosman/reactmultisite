import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { attributesKey, cartesian, normalizeAttributes, skuSafe } from "@/lib/variants/utils";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id: productId } = await params;
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id,slug,price_cents")
    .eq("id", productId)
    .maybeSingle();

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: variants, error } = await supabaseAdmin
    .from("product_variants")
    .select("id,sku,name,price_cents_override,stock_qty,attributes,active")
    .eq("product_id", productId)
    .order("sku", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    product,
    variants: (variants ?? []).map((v) => ({
      ...v,
      attributes: normalizeAttributes(v.attributes),
    })),
  });
}

const upsertSchema = z.object({
  sku: z.string().min(1),
  name: z.string().optional().nullable(),
  price_cents_override: z.number().int().min(0).nullable().optional(),
  stock_qty: z.number().int().min(0),
  active: z.boolean().default(true),
  attributes: z.record(z.string(), z.string()).default({}),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id: productId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabaseAdmin = createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from("product_variants")
    .insert({
      product_id: productId,
      sku: parsed.data.sku,
      name: parsed.data.name ?? null,
      price_cents_override: parsed.data.price_cents_override ?? null,
      stock_qty: parsed.data.stock_qty,
      attributes: parsed.data.attributes,
      active: parsed.data.active,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}

const generateSchema = z.object({
  attributes: z.array(
    z.object({
      name: z.string().trim().min(1),
      values: z.array(z.string().trim().min(1)).min(1),
    })
  ),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // PUT here means: generate variations from attribute definitions (WooCommerce-style)
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id: productId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id,slug,price_cents")
    .eq("id", productId)
    .maybeSingle();

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("product_variants")
    .select("id,sku,attributes")
    .eq("product_id", productId);

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const existingByKey = new Map<string, { id: string; sku: string }>();
  const usedSkus = new Set<string>();

  (existing ?? []).forEach((v) => {
    const key = attributesKey(normalizeAttributes(v.attributes));
    existingByKey.set(key, { id: v.id, sku: v.sku });
    usedSkus.add(v.sku);
  });

  const axes = parsed.data.attributes.map((a) => {
    const uniqueVals = Array.from(new Set(a.values.map((x) => x.trim()).filter(Boolean)));
    return uniqueVals.map((val) => ({ name: a.name.trim(), value: val }));
  });

  const combos = cartesian(axes);

  const toInsert: { sku: string; attributes: Record<string, string>; name: string }[] = [];

  for (const combo of combos) {
    const attrs: Record<string, string> = {};
    for (const part of combo) {
      attrs[part.name] = part.value;
    }

    const key = attributesKey(attrs);
    if (existingByKey.has(key)) continue;

    const name = Object.keys(attrs)
      .sort()
      .map((k) => `${k}: ${attrs[k]}`)
      .join(" • ");

    const skuBase = skuSafe(`${product.slug}-${Object.keys(attrs).sort().map((k) => attrs[k]).join("-")}`);

    let sku = skuBase;
    let n = 2;
    while (usedSkus.has(sku) || !sku) {
      sku = `${skuBase}-${n}`;
      n += 1;
    }
    usedSkus.add(sku);

    toInsert.push({ sku, attributes: attrs, name });
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("product_variants")
    .insert(
      toInsert.map((v) => ({
        product_id: productId,
        sku: v.sku,
        name: v.name,
        price_cents_override: null,
        stock_qty: 0,
        attributes: v.attributes,
        active: true,
      }))
    );

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ created: toInsert.length });
}
