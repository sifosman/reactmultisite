import { NextResponse } from "next/server";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ items: [] });
  }

  const supabase = await createPublicSupabaseServerClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,slug,price_cents,compare_at_price_cents,product_images(url,sort_order)")
    .eq("active", true)
    .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
    .limit(6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (products ?? []).map((product) => {
    const images = (product.product_images ?? []) as Array<{ url: string; sort_order: number | null }>;
    const imageUrl = images
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      priceCents: product.price_cents,
      compareAtCents: product.compare_at_price_cents,
      imageUrl,
    };
  });

  return NextResponse.json({ items });
}
