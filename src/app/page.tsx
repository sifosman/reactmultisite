import Link from "next/link";
import { Truck, Shield, CreditCard, RotateCcw, ChevronRight, Sparkles } from "lucide-react";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { ProductCard } from "@/components/storefront/ProductCard";
import { getSiteConfig } from "@/lib/config/site";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";

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
  const promoCards = (homepage.promoCards ?? {}) as Record<string, unknown>;
  const promoLeft = (promoCards.left ?? {}) as Record<string, unknown>;
  const promoRight = (promoCards.right ?? {}) as Record<string, unknown>;
  const categorySectionsRaw = Array.isArray(homepage.categorySections)
    ? (homepage.categorySections as Array<Record<string, unknown>>)
    : [];

  const heroTitle = typeof hero.title === "string" ? hero.title : "Discover Your Style";
  const heroSubtitle = typeof hero.subtitle === "string" ? hero.subtitle : "Explore our curated collection of premium products designed for the modern lifestyle.";
  const ctaText = typeof hero.ctaText === "string" ? hero.ctaText : "Shop Collection";
  const ctaHref = typeof hero.ctaHref === "string" ? hero.ctaHref : "/products";
  const heroImageUrl = typeof hero.imageUrl === "string" ? hero.imageUrl : null;

  const leftBadge = typeof promoLeft.badge === "string" ? promoLeft.badge : "Limited Time";
  const leftTitle = typeof promoLeft.title === "string" ? promoLeft.title : "Summer Sale";
  const leftSubtitle = typeof promoLeft.subtitle === "string" ? promoLeft.subtitle : "Up to 40% off selected items";
  const leftButtonText = typeof promoLeft.buttonText === "string" ? promoLeft.buttonText : "Shop Sale";
  const leftButtonHref = typeof promoLeft.buttonHref === "string" ? promoLeft.buttonHref : "/products";
  const leftTheme = promoLeft.theme === "sky" ? "sky" : "amber";
  const leftImageUrl = typeof promoLeft.imageUrl === "string" ? promoLeft.imageUrl : null;

  const rightBadge = typeof promoRight.badge === "string" ? promoRight.badge : "New Collection";
  const rightTitle = typeof promoRight.title === "string" ? promoRight.title : "Premium Picks";
  const rightSubtitle = typeof promoRight.subtitle === "string" ? promoRight.subtitle : "Discover our curated selection";
  const rightButtonText = typeof promoRight.buttonText === "string" ? promoRight.buttonText : "Explore Now";
  const rightButtonHref = typeof promoRight.buttonHref === "string" ? promoRight.buttonHref : "/products";
  const rightTheme = promoRight.theme === "amber" ? "amber" : "sky";
  const rightImageUrl = typeof promoRight.imageUrl === "string" ? promoRight.imageUrl : null;

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id,name,slug,image_url").order("created_at", { ascending: false }).limit(6),
    supabase
      .from("products")
      .select("id,name,slug,price_cents,compare_at_price_cents,product_images(url,sort_order)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const categorySections = categorySectionsRaw
    .map((s, index) => {
      const slug = typeof s.categorySlug === "string" ? s.categorySlug : "";
      const title = typeof s.title === "string" ? s.title : "";
      const imageUrl = typeof s.imageUrl === "string" ? s.imageUrl : "";
      return {
        id: (typeof s.id === "string" && s.id) || `cat-card-${index + 1}`,
        categorySlug: slug,
        title,
        imageUrl,
      };
    })
    .filter((s) => s.categorySlug);

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

      {categorySections.length > 0 ? (
        <section className="bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
                  Featured categories
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Curated sections from your homepage settings
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categorySections.map((card) => {
                const cat = (categories ?? []).find((c) => c.slug === card.categorySlug);
                if (!cat) return null;

                const bgUrl = card.imageUrl || (cat as any).image_url || null;
                const fallbackBg = "from-zinc-100 via-zinc-50 to-white";

                return (
                  <Link
                    key={card.id}
                    href={`/category/${cat.slug}`}
                    className="group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div
                      className={`relative h-40 w-full ${
                        bgUrl
                          ? "bg-zinc-100"
                          : `bg-gradient-to-br ${fallbackBg} bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] bg-[size:18px_18px]`
                      }`}
                      style={
                        bgUrl
                          ? {
                              backgroundImage: `url(${bgUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-between p-5">
                        <div className="text-xs font-medium uppercase tracking-wide text-white/80">
                          Category
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-white sm:text-xl">
                            {card.title || cat.name}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-white/80">
                            Shop now
                            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

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
            <NewsletterSignup variant="dark" source="homepage" />
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
            <div
              className={`group relative overflow-hidden rounded-3xl p-8 sm:p-12 ${
                leftImageUrl
                  ? "bg-zinc-100"
                  : leftTheme === "sky"
                  ? "bg-gradient-to-br from-sky-100 to-indigo-100"
                  : "bg-gradient-to-br from-amber-100 to-orange-100"
              }`}
              style={leftImageUrl ? { backgroundImage: `url(${leftImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >
              {leftImageUrl ? <div className="absolute inset-0 bg-white/65" /> : null}
              <div className="relative z-10">
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    leftTheme === "sky" ? "bg-sky-500/20 text-sky-800" : "bg-amber-500/20 text-amber-800"
                  }`}
                >
                  {leftBadge}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-zinc-900 sm:text-3xl">{leftTitle}</h3>
                <p className="mt-2 text-zinc-600">{leftSubtitle}</p>
                <Link
                  href={leftButtonHref}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  {leftButtonText}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              {!leftImageUrl ? (
                <div
                  className={`absolute -bottom-10 -right-10 h-40 w-40 rounded-full blur-3xl transition-all group-hover:scale-150 ${
                    leftTheme === "sky" ? "bg-sky-300/50" : "bg-amber-300/50"
                  }`}
                />
              ) : null}
            </div>

            <div
              className={`group relative overflow-hidden rounded-3xl p-8 sm:p-12 ${
                rightImageUrl
                  ? "bg-zinc-100"
                  : rightTheme === "amber"
                  ? "bg-gradient-to-br from-amber-100 to-orange-100"
                  : "bg-gradient-to-br from-sky-100 to-indigo-100"
              }`}
              style={rightImageUrl ? { backgroundImage: `url(${rightImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >
              {rightImageUrl ? <div className="absolute inset-0 bg-white/65" /> : null}
              <div className="relative z-10">
                <div
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    rightTheme === "amber" ? "bg-amber-500/20 text-amber-800" : "bg-sky-500/20 text-sky-800"
                  }`}
                >
                  {rightBadge}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-zinc-900 sm:text-3xl">{rightTitle}</h3>
                <p className="mt-2 text-zinc-600">{rightSubtitle}</p>
                <Link
                  href={rightButtonHref}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                >
                  {rightButtonText}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              {!rightImageUrl ? (
                <div
                  className={`absolute -bottom-10 -right-10 h-40 w-40 rounded-full blur-3xl transition-all group-hover:scale-150 ${
                    rightTheme === "amber" ? "bg-amber-300/50" : "bg-sky-300/50"
                  }`}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
