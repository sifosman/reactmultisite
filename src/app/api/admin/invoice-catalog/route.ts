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

  // Enhanced search with multiple strategies
  const searchStrategies = [
    // Exact phrase match (highest priority)
    {
      name: "exact_phrase",
      productConditions: [`name.ilike.%${q}%`, `slug.ilike.%${q}%`],
      variantConditions: [`sku.ilike.%${q}%`, `name.ilike.%${q}%`],
      weight: 3
    },
    // Individual word matches
    {
      name: "words",
      words: q.split(/\s+/).filter(word => word.length > 0),
      weight: 2
    },
    // Partial matches (lower priority)
    {
      name: "partial",
      productConditions: [`name.ilike.%${q}%`, `description.ilike.%${q}%`, `slug.ilike.%${q}%`],
      variantConditions: [`sku.ilike.%${q}%`, `name.ilike.%${q}%`],
      weight: 1
    }
  ];

  let allResults: Array<{
    item: any;
    kind: "product" | "variant";
    score: number;
    match_type: string;
  }> = [];

  // Execute search strategies
  for (const strategy of searchStrategies) {
    if (strategy.name === "words") {
      // Word-based search
      const words = strategy.words as string[];
      for (const word of words) {
        if (word.length < 2) continue; // Skip very short words
        
        const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
          await Promise.all([
            supabaseAdmin
              .from("products")
              .select("id,name,slug,price_cents,has_variants,stock_qty,active,description")
              .or(`name.ilike.%${word}%,slug.ilike.%${word}%,description.ilike.%${word}%`)
              .limit(20),
            supabaseAdmin
              .from("product_variants")
              .select("id,product_id,sku,name,price_cents_override,stock_qty,attributes,active")
              .or(`sku.ilike.%${word}%,name.ilike.%${word}%`)
              .limit(30),
          ]);

        if (!productsError && products) {
          products.forEach(p => {
            const exactMatch = p.name.toLowerCase() === word.toLowerCase() || 
                              p.slug?.toLowerCase() === word.toLowerCase();
            allResults.push({
              item: p,
              kind: "product",
              score: strategy.weight * (exactMatch ? 2 : 1) * (word.length > 3 ? 1.2 : 1),
              match_type: `word_${word}${exactMatch ? '_exact' : ''}`
            });
          });
        }

        if (!variantsError && variants) {
          variants.forEach(v => {
            const exactMatch = v.sku?.toLowerCase() === word.toLowerCase() || 
                              v.name?.toLowerCase() === word.toLowerCase();
            allResults.push({
              item: v,
              kind: "variant",
              score: strategy.weight * (exactMatch ? 3 : 1.5) * (word.length > 3 ? 1.2 : 1),
              match_type: `word_${word}${exactMatch ? '_exact' : ''}`
            });
          });
        }
      }
    } else {
      // Exact phrase and partial matches
      const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
        await Promise.all([
          supabaseAdmin
            .from("products")
            .select("id,name,slug,price_cents,has_variants,stock_qty,active,description")
            .or((strategy.productConditions as string[]).join(','))
            .limit(30),
          supabaseAdmin
            .from("product_variants")
            .select("id,product_id,sku,name,price_cents_override,stock_qty,attributes,active")
            .or((strategy.variantConditions as string[]).join(','))
            .limit(40),
        ]);

      if (!productsError && products) {
        products.forEach(p => {
          const exactMatch = p.name.toLowerCase() === q.toLowerCase() || 
                            p.slug?.toLowerCase() === q.toLowerCase();
          allResults.push({
            item: p,
            kind: "product",
            score: strategy.weight * (exactMatch ? 2 : 1),
            match_type: `${strategy.name}${exactMatch ? '_exact' : ''}`
          });
        });
      }

      if (!variantsError && variants) {
        variants.forEach(v => {
          const exactMatch = v.sku?.toLowerCase() === q.toLowerCase() || 
                            v.name?.toLowerCase() === q.toLowerCase();
          allResults.push({
            item: v,
            kind: "variant",
            score: strategy.weight * (exactMatch ? 2.5 : 1.2),
            match_type: `${strategy.name}${exactMatch ? '_exact' : ''}`
          });
        });
      }
    }
  }

  // Remove duplicates and sort by score
  const uniqueResults = new Map();
  
  allResults.forEach(result => {
    const key = result.kind === "product" 
      ? `product_${result.item.id}`
      : `variant_${result.item.id}`;
    
    const existing = uniqueResults.get(key);
    if (!existing || result.score > existing.score) {
      uniqueResults.set(key, result);
    }
  });

  const sortedResults = Array.from(uniqueResults.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 60);

  // Build product lookup
  const productsById = new Map();
  const variantProductIds = new Set();

  // Collect all product IDs needed
  sortedResults.forEach(result => {
    if (result.kind === "product") {
      productsById.set(result.item.id, { ...result.item, _score: result.score, _match_type: result.match_type });
    } else {
      variantProductIds.add(result.item.product_id);
    }
  });

  // Fetch missing product data for variants
  const missingProductIds = Array.from(variantProductIds).filter(id => !productsById.has(id));
  if (missingProductIds.length > 0) {
    const { data: moreProducts } = await supabaseAdmin
      .from("products")
      .select("id,name,slug,price_cents,has_variants,stock_qty,active,description")
      .in("id", missingProductIds);

    (moreProducts ?? []).forEach(p => productsById.set(p.id, p));
  }

  // Build final items
  const items = sortedResults.map(result => {
    if (result.kind === "product") {
      const p = result.item;
      return {
        kind: "simple" as const,
        product_id: p.id,
        variant_id: null,
        title: p.name,
        variant_name: null,
        sku: null,
        stock_qty: p.stock_qty,
        unit_price_cents_default: p.price_cents,
        variant_snapshot: {},
        _score: result.score,
        _match_type: result.match_type
      };
    } else {
      const v = result.item;
      const p = productsById.get(v.product_id);
      if (!p) return null;

      const defaultUnit = v.price_cents_override ?? p.price_cents;

      return {
        kind: "variant" as const,
        product_id: v.product_id,
        variant_id: v.id,
        title: p.name,
        variant_name: v.name,
        sku: v.sku,
        stock_qty: v.stock_qty,
        unit_price_cents_default: defaultUnit,
        variant_snapshot: {
          sku: v.sku,
          name: v.name,
          attributes: v.attributes,
        },
        _score: result.score,
        _match_type: result.match_type
      };
    }
  }).filter(Boolean);

  return NextResponse.json({ items });
}
