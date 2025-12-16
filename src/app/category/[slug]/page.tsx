import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createPublicSupabaseServerClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (categoryError) throw new Error(categoryError.message);
  if (!category) notFound();

  const { data: joins, error: joinError } = await supabase
    .from("product_categories")
    .select("product_id")
    .eq("category_id", category.id)
    .limit(500);

  if (joinError) throw new Error(joinError.message);

  const productIds = (joins ?? []).map((j) => j.product_id);

  const { data: products, error: productsError } = productIds.length
    ? await supabase
        .from("products")
        .select("id,name,slug,price_cents,compare_at_price_cents")
        .in("id", productIds)
        .eq("active", true)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (productsError) throw new Error(productsError.message);

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-zinc-600">Category</div>
          <h1 className="text-2xl font-semibold">{category.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-md border px-3 py-2 text-sm" href="/categories">
            All categories
          </Link>
          <Link className="rounded-md border px-3 py-2 text-sm" href="/products">
            All products
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => {
          const price = (p.price_cents / 100).toFixed(2);
          const compareAt = p.compare_at_price_cents ? (p.compare_at_price_cents / 100).toFixed(2) : null;

          return (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="rounded-xl border bg-white p-4 transition hover:shadow-sm"
            >
              <div className="text-sm text-zinc-600">Product</div>
              <div className="mt-1 line-clamp-2 font-medium">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-2">
                <div className="text-lg font-semibold">R{price}</div>
                {compareAt ? <div className="text-sm text-zinc-500 line-through">R{compareAt}</div> : null}
              </div>
            </Link>
          );
        })}
      </div>

      {(products ?? []).length === 0 ? (
        <div className="mt-10 rounded-xl border bg-white p-6 text-sm text-zinc-600">
          No products assigned to this category yet.
        </div>
      ) : null}
    </main>
  );
}
