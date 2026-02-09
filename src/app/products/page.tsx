import Link from "next/link";
import { SlidersHorizontal, Grid3X3, LayoutGrid, ChevronRight } from "lucide-react";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { ProductCard } from "@/components/storefront/ProductCard";
import { FiltersPanel } from "@/components/storefront/FiltersPanel";

export const revalidate = 60;

function normalizeAttrKey(name: string) {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, "-");
  return normalized === "colour" ? "color" : normalized;
}

function toNumber(input: string | undefined) {
  if (!input) return null;
  const value = Number(input);
  return Number.isFinite(value) ? value : null;
}

function normalizeAttributeValues(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : String(entry)))
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  return [];
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    size?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    limit?: string;
    sort?: string;
    [key: string]: string | undefined;
  }>;
}) {
  const params = await searchParams;
  const { q, size, color, minPrice, maxPrice, limit, sort } = params;
  const query = typeof q === "string" ? q.trim() : "";
  const sizeFilter = typeof size === "string" ? size : "";
  const colorFilter = typeof color === "string" ? color : "";
  const minPriceValue = toNumber(typeof minPrice === "string" ? minPrice : undefined);
  const maxPriceValue = toNumber(typeof maxPrice === "string" ? maxPrice : undefined);
  const limitValueRaw = toNumber(typeof limit === "string" ? limit : undefined);
  const limitValue = Math.min(120, Math.max(24, limitValueRaw ?? 24));
  const sortValue = typeof sort === "string" ? sort : "featured";
  const otherFilters = Object.entries(params)
    .filter(([key, value]) => key.startsWith("attr_") && typeof value === "string" && value.trim())
    .reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key.replace("attr_", "")] = value as string;
      return acc;
    }, {});

  const supabase = await createPublicSupabaseServerClient();

  let builder = supabase
    .from("products")
    .select("id,name,slug,price_cents,compare_at_price_cents,stock_qty,has_variants,created_at,product_images(url,sort_order)")
    .eq("active", true)
    .limit(limitValue);

  if (sortValue === "price_asc") {
    builder = builder.order("price_cents", { ascending: true }).order("created_at", { ascending: false });
  } else if (sortValue === "price_desc") {
    builder = builder.order("price_cents", { ascending: false }).order("created_at", { ascending: false });
  } else if (sortValue === "newest") {
    builder = builder.order("created_at", { ascending: false });
  } else {
    builder = builder.order("created_at", { ascending: false });
  }

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

  const productIds = (products ?? []).map((p) => p.id);
  const { data: variants, error: variantError } = productIds.length
    ? await supabase
        .from("product_variants")
        .select("product_id,attributes,stock_qty")
        .in("product_id", productIds)
        .eq("active", true)
    : { data: [], error: null };

  if (variantError) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {variantError.message}
        </div>
      </main>
    );
  }

  const attributesMap = new Map<string, { label: string; values: Set<string> }>();
  const variantsByProduct = new Map<
    string,
    Array<{ attributes: Record<string, string[]>; stockQty: number }>
  >();

  (variants ?? []).forEach((variant) => {
    const rawAttributes = (variant.attributes ?? {}) as Record<string, unknown>;
    const normalizedAttributes: Record<string, string[]> = {};

    Object.entries(rawAttributes).forEach(([key, value]) => {
      const normalizedValues = normalizeAttributeValues(value);
      if (normalizedValues.length === 0) return;
      const normalizedKey = normalizeAttrKey(key);
      normalizedAttributes[normalizedKey] = normalizedValues;

      const existing = attributesMap.get(normalizedKey) ?? {
        label: key.trim(),
        values: new Set<string>(),
      };
      normalizedValues.forEach((entry) => existing.values.add(entry));
      attributesMap.set(normalizedKey, existing);
    });

    const list = variantsByProduct.get(variant.product_id) ?? [];
    list.push({
      attributes: normalizedAttributes,
      stockQty: typeof variant.stock_qty === "number" ? variant.stock_qty : 0,
    });
    variantsByProduct.set(variant.product_id, list);
  });

  const sizeAttribute = attributesMap.get("size");
  const colorAttribute = attributesMap.get("color");
  const otherAttributes = Array.from(attributesMap.entries())
    .filter(([key]) => key !== "size" && key !== "color")
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const filteredProducts = (products ?? []).filter((product) => {
    if (minPriceValue !== null && product.price_cents < minPriceValue * 100) return false;
    if (maxPriceValue !== null && product.price_cents > maxPriceValue * 100) return false;

    const variantsForProduct = variantsByProduct.get(product.id) ?? [];
    const hasVariantStock = variantsForProduct.some((entry) => entry.stockQty > 0);

    if (product.has_variants) {
      if (!hasVariantStock) return false;
    } else if ((product.stock_qty ?? 0) <= 0) {
      return false;
    }

    if (
      sizeFilter &&
      !variantsForProduct.some((entry) => entry.attributes.size?.includes(sizeFilter))
    )
      return false;
    if (
      colorFilter &&
      !variantsForProduct.some((entry) => entry.attributes.color?.includes(colorFilter))
    )
      return false;

    for (const [key, value] of Object.entries(otherFilters)) {
      if (!variantsForProduct.some((entry) => entry.attributes[key]?.includes(value))) return false;
    }

    return true;
  });

  // Apply client-side sorting after filtering (for price sorts)
  const sortedProducts = filteredProducts.slice().sort((a, b) => {
    if (sortValue === "price_asc") return a.price_cents - b.price_cents;
    if (sortValue === "price_desc") return b.price_cents - a.price_cents;
    if (sortValue === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    // Default: featured (keep original order from DB which is by created_at desc)
    return 0;
  });

  const hasFilters =
    Boolean(sizeFilter || colorFilter) ||
    minPriceValue !== null ||
    maxPriceValue !== null ||
    Object.keys(otherFilters).length > 0;
  const clearFiltersHref = query ? `/products?q=${encodeURIComponent(query)}` : "/products";
  const hasMore = (products ?? []).length >= limitValue;
  const loadMoreParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (!value || key === "limit") return;
    loadMoreParams.set(key, value);
  });
  loadMoreParams.set("limit", String(Math.min(limitValue + 24, 120)));
  const loadMoreHref = `/products?${loadMoreParams.toString()}`;

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
                  : "Discover our curated collection of quality products"
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
        {/* Filters */}
        <FiltersPanel
          title="Filter products"
          description="Narrow results by size, color, price, and product attributes."
          action={
            hasFilters ? (
              <Link
                href={clearFiltersHref}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Clear filters
              </Link>
            ) : null
          }
        >
          <form method="get" id="products-filters" className="grid gap-4 lg:grid-cols-5">
            {query ? <input type="hidden" name="q" value={query} /> : null}
            <input type="hidden" name="limit" value={String(limitValue)} />
            <input type="hidden" name="sort" value={sortValue} />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Size</label>
              <select
                name="size"
                defaultValue={sizeFilter}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              >
                <option value="">All sizes</option>
                {Array.from(sizeAttribute?.values ?? [])
                  .sort((a, b) => a.localeCompare(b))
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Color</label>
              <select
                name="color"
                defaultValue={colorFilter}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              >
                <option value="">All colors</option>
                {Array.from(colorAttribute?.values ?? [])
                  .sort((a, b) => a.localeCompare(b))
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Min price</label>
              <input
                name="minPrice"
                type="number"
                min="0"
                step="1"
                defaultValue={minPriceValue ?? undefined}
                placeholder="0"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Max price</label>
              <input
                name="maxPrice"
                type="number"
                min="0"
                step="1"
                defaultValue={maxPriceValue ?? undefined}
                placeholder="5000"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Apply filters
              </button>
            </div>

            {otherAttributes.length > 0 ? (
              <div className="lg:col-span-5">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {otherAttributes.map((attr) => (
                    <div key={attr.key} className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {attr.label}
                      </label>
                      <select
                        name={`attr_${attr.key}`}
                        defaultValue={otherFilters[attr.key] ?? ""}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                      >
                        <option value="">All {attr.label}</option>
                        {Array.from(attr.values)
                          .sort((a, b) => a.localeCompare(b))
                          .map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </form>
        </FiltersPanel>
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            Showing <span className="font-medium text-zinc-900">{sortedProducts.length}</span> products
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
              <select
                name="sort"
                form="products-filters"
                defaultValue={sortValue}
                onChange={(e) => {
                  const form = document.getElementById('products-filters') as HTMLFormElement;
                  if (form) form.submit();
                }}
                className="rounded-lg border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm focus:border-zinc-400 focus:ring-zinc-400"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest First</option>
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
        {sortedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {sortedProducts.map((p) => {
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
              {query || hasFilters
              ? "Try adjusting your filters or search term"
              : "Products will appear here once added"}
            </p>
            <Link 
              href={clearFiltersHref}
              className="mt-6 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Reset filters
            </Link>
          </div>
        )}

        {/* Load More placeholder */}
        {hasMore && (
          <div className="mt-12 text-center">
            <Link
              href={loadMoreHref}
              scroll={false}
              className="inline-flex rounded-full border-2 border-zinc-200 bg-white px-8 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              Load more products
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
