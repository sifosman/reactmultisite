import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Grid3X3, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { ProductCard } from "@/components/storefront/ProductCard";

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

function renderError(message: string) {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {message}
        </div>
      </div>
    </main>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    size?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    [key: string]: string | undefined;
  }>;
}) {
  const { slug } = await params;
  const filters = await searchParams;
  const { size, color, minPrice, maxPrice } = filters;
  const sizeFilter = typeof size === "string" ? size : "";
  const colorFilter = typeof color === "string" ? color : "";
  const minPriceValue = toNumber(typeof minPrice === "string" ? minPrice : undefined);
  const maxPriceValue = toNumber(typeof maxPrice === "string" ? maxPrice : undefined);
  const otherFilters = Object.entries(filters)
    .filter(([key, value]) => key.startsWith("attr_") && typeof value === "string" && value.trim())
    .reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key.replace("attr_", "")] = value as string;
      return acc;
    }, {});
  const supabase = await createPublicSupabaseServerClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();

  if (categoryError) return renderError(categoryError.message);
  if (!category) notFound();

  const { data: joins, error: joinError } = await supabase
    .from("product_categories")
    .select("product_id")
    .eq("category_id", category.id)
    .limit(500);

  if (joinError) return renderError(joinError.message);

  const productIds = (joins ?? []).map((j) => j.product_id);

  const { data: products, error: productsError } = productIds.length
    ? await supabase
        .from("products")
        .select("id,name,slug,price_cents,compare_at_price_cents,product_images(url,sort_order)")
        .in("id", productIds)
        .eq("active", true)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (productsError) return renderError(productsError.message);

  const { data: variants, error: variantError } = productIds.length
    ? await supabase
        .from("product_variants")
        .select("product_id,attributes")
        .in("product_id", productIds)
        .eq("active", true)
    : { data: [], error: null };

  if (variantError) return renderError(variantError.message);

  const attributesMap = new Map<string, { label: string; values: Set<string> }>();
  const variantsByProduct = new Map<string, Array<Record<string, string[]>>>();

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

    if (Object.keys(normalizedAttributes).length > 0) {
      const list = variantsByProduct.get(variant.product_id) ?? [];
      list.push(normalizedAttributes);
      variantsByProduct.set(variant.product_id, list);
    }
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
    if (sizeFilter && !variantsForProduct.some((attrs) => attrs.size?.includes(sizeFilter))) return false;
    if (colorFilter && !variantsForProduct.some((attrs) => attrs.color?.includes(colorFilter))) return false;

    for (const [key, value] of Object.entries(otherFilters)) {
      if (!variantsForProduct.some((attrs) => attrs[key]?.includes(value))) return false;
    }

    return true;
  });

  const hasFilters =
    Boolean(sizeFilter || colorFilter) ||
    minPriceValue !== null ||
    maxPriceValue !== null ||
    Object.keys(otherFilters).length > 0;
  const clearFiltersHref = `/category/${category.slug}`;

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Page Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-900">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/categories" className="hover:text-zinc-900">Categories</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-zinc-900">{category.name}</span>
          </nav>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm font-medium uppercase tracking-wide text-zinc-500">Category</div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                {category.name}
              </h1>
              <p className="mt-2 text-zinc-600">
                Browse everything in {category.name} with size, color, and price filters.
              </p>
            </div>
            <div className="flex gap-2">
              <Link className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium" href="/categories">
                All categories
              </Link>
              <Link className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium" href="/products">
                All products
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Filter products</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Narrow results by size, color, price, and product attributes.
              </p>
            </div>
            {hasFilters ? (
              <Link
                href={clearFiltersHref}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Clear filters
              </Link>
            ) : null}
          </div>

          <form method="get" className="mt-6 grid gap-4 lg:grid-cols-5">
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
        </div>

        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-600">
            Showing <span className="font-medium text-zinc-900">{filteredProducts.length}</span> products
          </p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
              <select className="rounded-lg border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm focus:border-zinc-400 focus:ring-zinc-400">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
            <div className="flex rounded-lg border border-zinc-200 bg-white p-1">
              <button className="rounded-md bg-zinc-900 p-2 text-white">
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button className="rounded-md p-2 text-zinc-400 hover:text-zinc-600">
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {filteredProducts.map((p) => {
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
            <p className="mt-2 text-sm text-zinc-600">Try adjusting your filters</p>
            <Link
              href={clearFiltersHref}
              className="mt-6 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              Reset filters
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
