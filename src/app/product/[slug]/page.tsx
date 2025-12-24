import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { AddToCart } from "@/components/cart/AddToCart";
import type { AddToCartVariant } from "@/components/cart/AddToCart";
import { ProductGallery } from "@/components/storefront/ProductGallery";

export const revalidate = 60;

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createPublicSupabaseServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("id,name,slug,description,price_cents,compare_at_price_cents,has_variants")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!product) {
    notFound();
  }

  const isOnSale =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > product.price_cents;

  const [{ data: images }, { data: variants }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id,url,sort_order")
      .eq("product_id", product.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("id,sku,name,price_cents_override,stock_qty,attributes")
      .eq("product_id", product.id)
      .eq("active", true)
      .order("sku", { ascending: true }),
  ]);

  const price = (product.price_cents / 100).toFixed(2);
  const compareAt = product.compare_at_price_cents
    ? (product.compare_at_price_cents / 100).toFixed(2)
    : null;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <nav className="text-sm text-zinc-800" aria-label="Breadcrumb">
        <Link className="hover:underline" href="/products">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-zinc-900">{product.name}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ProductGallery images={(images ?? []) as Array<{ id: string; url: string }>} alt={product.name} />
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border bg-white p-6 text-zinc-900 shadow-sm">
            <div className="text-xs font-semibold tracking-wide text-zinc-800">Product</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h1>

            <div className="mt-4 flex items-center gap-3">
              {isOnSale ? (
                <div className="inline-flex rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Sale
                </div>
              ) : null}
              <div className="flex items-baseline gap-3">
                <div className="text-2xl font-semibold">R{(product.price_cents / 100).toFixed(2)}</div>
                {product.compare_at_price_cents ? (
                  <div className="text-sm text-zinc-700 line-through">R{(product.compare_at_price_cents / 100).toFixed(2)}</div>
                ) : null}
              </div>
            </div>

            {product.description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{product.description}</p>
            ) : null}

            <div className="mt-6">
              <AddToCart
                productId={product.id}
                productHasVariants={product.has_variants}
                basePriceCents={product.price_cents}
                variants={(variants ?? []) as unknown as AddToCartVariant[]}
              />
            </div>

            <div className="mt-6 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-900">Shipping</span>
                <span className="font-semibold">Flat R60</span>
              </div>
              <div className="mt-2 text-xs text-zinc-800">
                Secure checkout. Totals are recalculated server-side.
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Link className="flex-1 rounded-full border bg-white px-4 py-2 text-center text-sm hover:bg-zinc-50" href="/products">
              Continue shopping
            </Link>
            <Link className="flex-1 rounded-full bg-black px-4 py-2 text-center text-sm text-white" href="/cart">
              View cart
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
