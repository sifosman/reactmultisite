import Link from "next/link";
import { SlidersHorizontal, Grid3X3, LayoutGrid, ChevronRight } from "lucide-react";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { ProductCard } from "@/components/storefront/ProductCard";

export const revalidate = 60;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  const supabase = await createPublicSupabaseServerClient();

  let builder = supabase
    .from("products")
    .select("id,name,slug,price_cents,compare_at_price_cents,product_images(url,sort_order)")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(24);

  if (query) {
    builder = builder.ilike("name", `%${query}%`);
  }

  const { data: products, error } = await builder;

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-900">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-zinc-900">Products</span>
          </nav>
          
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                {query ? `Search: "${query}"` : "All Products"}
              </h1>
              <p className="mt-2 text-zinc-600">
                {query 
                  ? `${(products ?? []).length} results found`
                  : "Discover our curated collection of premium products"
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {query && (
                <Link 
                  href="/products" 
                  className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  Clear search
                </Link>
              )}
              <Link 
                href="/categories" 
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Browse categories
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            Showing <span className="font-medium text-zinc-900">{(products ?? []).length}</span> products
          </p>
          
          <div className="flex items-center gap-4">
            {/* Sort dropdown placeholder */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
              <select className="rounded-lg border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm focus:border-zinc-400 focus:ring-zinc-400">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
              </select>
            </div>
            
            {/* View toggle */}
            <div className="hidden items-center gap-1 rounded-lg border bg-white p-1 sm:flex">
              <button className="rounded-md bg-zinc-100 p-2 text-zinc-900">
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button className="rounded-md p-2 text-zinc-400 hover:text-zinc-600">
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {(products ?? []).length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {(products ?? []).map((p) => {
              const imgs = (p.product_images ?? []) as Array<{ url: string; sort_order: number | null }>;
              const first = imgs
                .slice()
                .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.url ?? null;

              return (
                <ProductCard
                  key={p.id}
                  slug={p.slug}
                  name={p.name}
                  priceCents={p.price_cents}
                  compareAtCents={p.compare_at_price_cents}
                  imageUrl={first}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <Grid3X3 className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900">No products found</h3>
            <p className="mt-2 text-sm text-zinc-600">
              {query ? "Try a different search term" : "Products will appear here once added"}
            </p>
            <Link 
              href="/categories"
              className="mt-6 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Browse categories
            </Link>
          </div>
        )}

        {/* Load More placeholder */}
        {(products ?? []).length >= 24 && (
          <div className="mt-12 text-center">
            <button className="rounded-full border-2 border-zinc-200 bg-white px-8 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50">
              Load more products
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
