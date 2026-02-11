import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { AddToCart } from "@/components/cart/AddToCart";
import type { AddToCartVariant } from "@/components/cart/AddToCart";
import { ProductGallery } from "@/components/storefront/ProductGallery";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import { getSimpleProductStockMessage } from "../stockMessage";

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
    .select(
      "id,name,slug,description,price_cents,compare_at_price_cents,has_variants,stock_qty,product_images(id,url,sort_order)"
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching product:", error);
    notFound();
  }

  if (!product) {
    notFound();
  }

  const isOnSale =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > product.price_cents;

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id,sku,name,price_cents_override,stock_qty,attributes")
    .eq("product_id", product.id)
    .eq("active", true)
    .order("sku", { ascending: true });

  const galleryImages = ((product as any).product_images ?? []) as Array<{
    id: string;
    url: string;
    sort_order: number | null;
  }>;
  const orderedGalleryImages = galleryImages
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(({ id, url }) => ({ id, url }));

  const price = (product.price_cents / 100).toFixed(2);
  const compareAt = product.compare_at_price_cents
    ? (product.compare_at_price_cents / 100).toFixed(2)
    : null;

  const variantList = (variants ?? []) as Array<{ stock_qty: number }>;
  const allVariantsOutOfStock =
    product.has_variants && variantList.length > 0 && variantList.every((v) => v.stock_qty <= 0);

  // For simple products (no variants), rely on the product-level stock quantity used by checkout.
  const isOutOfStock = product.has_variants ? allVariantsOutOfStock : product.stock_qty <= 0;

  const simpleStockMessage = !product.has_variants
    ? getSimpleProductStockMessage((product as any).stock_qty ?? null)
    : null;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl p-6">
        <ScrollToTop />
        <nav className="text-sm text-zinc-800" aria-label="Breadcrumb">
          <Link className="hover:underline" href="/products">
            Products
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-zinc-900">{product.name}</span>
        </nav>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ProductGallery images={orderedGalleryImages} alt={product.name} />
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border bg-white p-6 text-zinc-900 shadow-sm">
              <div className="text-xs font-semibold tracking-wide text-zinc-800">Product</div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {isOnSale ? (
                <div className="inline-flex rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Sale
                </div>
              ) : null}
              {isOutOfStock ? (
                <div className="inline-flex rounded-full bg-zinc-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Out of stock
                </div>
              ) : null}
              <div className="flex items-baseline gap-3">
                <div className="text-2xl font-semibold">R{(product.price_cents / 100).toFixed(2)}</div>
                {product.compare_at_price_cents ? (
                  <div className="text-sm text-zinc-700 line-through">R{(product.compare_at_price_cents / 100).toFixed(2)}</div>
                ) : null}
              </div>
              {!product.has_variants && simpleStockMessage && !isOutOfStock ? (
                <div className="mt-1 text-sm text-zinc-700">{simpleStockMessage}</div>
              ) : null}
            </div>

            {product.description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{product.description}</p>
            ) : null}

            {isOutOfStock ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                This item is currently out of stock and cannot be added to your cart.
              </div>
            ) : (
              <div className="mt-6">
                <AddToCart
                  productId={product.id}
                  productHasVariants={product.has_variants}
                  basePriceCents={product.price_cents}
                  variants={(variants ?? []) as unknown as AddToCartVariant[]}
                  simpleProductStockQty={product.has_variants ? undefined : (product as any).stock_qty ?? null}
                />
              </div>
            )}

            <div className="mt-6 rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-zinc-900">Shipping</span>
                <span className="font-semibold">Flat R60</span>
              </div>
              <div className="mt-2 text-xs text-zinc-800">
                Secure Checkout
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
      </div>
    </main>
  );
}
