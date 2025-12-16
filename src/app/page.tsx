import Link from "next/link";
import { Truck, Shield, CreditCard, RotateCcw, ChevronRight, Sparkles } from "lucide-react";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { ProductCard } from "@/components/storefront/ProductCard";
import { getSiteConfig } from "@/lib/config/site";

export const revalidate = 60;

export default function Home() {
  return <HomeContent />;
}

async function HomeContent() {
  const config = getSiteConfig();
  const supabase = await createPublicSupabaseServerClient();
  
  const { data } = await supabase
    .from("site_content")
    .select("key,data")
    .eq("key", "homepage")
    .maybeSingle();

  const homepage = (data?.data ?? {}) as Record<string, unknown>;
  const hero = (homepage.hero ?? {}) as Record<string, unknown>;

  const heroTitle = typeof hero.title === "string" ? hero.title : "Discover Your Style";
  const heroSubtitle = typeof hero.subtitle === "string" ? hero.subtitle : "Explore our curated collection of premium products designed for the modern lifestyle.";
  const ctaText = typeof hero.ctaText === "string" ? hero.ctaText : "Shop Collection";
  const ctaHref = typeof hero.ctaHref === "string" ? hero.ctaHref : "/products";
  const heroImageUrl = typeof hero.imageUrl === "string" ? hero.imageUrl : null;

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id,name,slug,image_url").order("created_at", { ascending: false }).limit(6),
    supabase
      .from("products")
      .select("id,name,slug,price_cents,compare_at_price_cents,product_images(url,sort_order)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <main>
      {/* Hero Section - Full Width Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span>New Season Collection Available</span>
              </div>
              
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {heroTitle}
              </h1>
              
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-300 sm:text-xl">
                {heroSubtitle}
              </p>
              
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Link 
                  href={ctaHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                >
                  {ctaText}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link 
                  href="/categories"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
            
            <div className="relative hidden lg:block">
              {heroImageUrl ? (
                <div className="relative">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={heroImageUrl} 
                    alt="Hero" 
                    className="relative rounded-3xl object-cover shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative aspect-square">
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl" />
                  <div className="relative flex h-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="text-center p-8">
                      <div className="text-6xl font-bold text-white/20">{config.name}</div>
                      <div className="mt-2 text-white/40">Upload a hero image in admin</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <Truck className="h-6 w-6 text-zinc-700" />
              </div>
              <div>
                <div className="font-semibold text-zinc-900">Free Shipping</div>
                <div className="text-sm text-zinc-500">On orders over R500</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <Shield className="h-6 w-6 text-zinc-700" />
              </div>
              <div>
                <div className="font-semibold text-zinc-900">Secure Payment</div>
                <div className="text-sm text-zinc-500">100% secure checkout</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <RotateCcw className="h-6 w-6 text-zinc-700" />
              </div>
              <div>
                <div className="font-semibold text-zinc-900">Easy Returns</div>
                <div className="text-sm text-zinc-500">30-day return policy</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <CreditCard className="h-6 w-6 text-zinc-700" />
              </div>
              <div>
                <div className="font-semibold text-zinc-900">Flexible Payment</div>
                <div className="text-sm text-zinc-500">Pay with card or EFT</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Shop by Category
              </h2>
              <p className="mt-2 text-lg text-zinc-600">
                Browse our curated collections
              </p>
            </div>
            <Link 
              href="/categories"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 hover:text-zinc-600 sm:mt-0"
            >
              View all categories
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(categories ?? []).slice(0, 6).map((c, idx) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  idx === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                }`}
              >
                <div className={`${idx === 0 ? "aspect-[16/9] sm:aspect-square" : "aspect-[4/3]"} w-full bg-gradient-to-br from-zinc-100 to-zinc-200`}>
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={c.image_url} 
                      alt={c.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl font-bold text-zinc-300">{c.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className={`font-bold text-white ${idx === 0 ? "text-2xl sm:text-3xl" : "text-xl"}`}>
                    {c.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-1 text-sm text-white/80">
                    <span>Shop now</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="bg-gradient-to-r from-zinc-900 to-zinc-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Get 15% Off Your First Order
              </h2>
              <p className="mt-2 text-zinc-400">
                Sign up for our newsletter and receive exclusive offers
              </p>
            </div>
            <div className="flex w-full max-w-md gap-3 sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full border-0 bg-white/10 px-5 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="shrink-0 rounded-full bg-white px-6 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-100">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3 w-3" />
                Just In
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                New Arrivals
              </h2>
              <p className="mt-2 text-lg text-zinc-600">
                The latest additions to our collection
              </p>
            </div>
            <Link 
              href="/products"
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:mt-0"
            >
              View all products
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
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
        </div>
      </section>

      {/* Two Column Promo */}
      <section className="bg-zinc-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 p-8 sm:p-12">
              <div className="relative z-10">
                <div className="inline-flex rounded-full bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-800">
                  Limited Time
                </div>
                <h3 className="mt-4 text-2xl font-bold text-zinc-900 sm:text-3xl">
                  Summer Sale
                </h3>
                <p className="mt-2 text-zinc-600">
                  Up to 40% off selected items
                </p>
                <Link
                  href="/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Shop Sale
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-amber-300/50 blur-3xl transition-all group-hover:scale-150" />
            </div>
            
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-100 to-indigo-100 p-8 sm:p-12">
              <div className="relative z-10">
                <div className="inline-flex rounded-full bg-sky-500/20 px-3 py-1 text-sm font-semibold text-sky-800">
                  New Collection
                </div>
                <h3 className="mt-4 text-2xl font-bold text-zinc-900 sm:text-3xl">
                  Premium Picks
                </h3>
                <p className="mt-2 text-zinc-600">
                  Discover our curated selection
                </p>
                <Link
                  href="/products"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  Explore Now
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-sky-300/50 blur-3xl transition-all group-hover:scale-150" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
