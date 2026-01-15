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
  const heroSubtitle =
    typeof hero.subtitle === "string"
      ? hero.subtitle
      : "Explore our curated collection of premium products designed for the modern lifestyle.";
  const ctaText = typeof hero.ctaText === "string" ? hero.ctaText : "Shop Collection";
  const ctaHref = typeof hero.ctaHref === "string" ? hero.ctaHref : "/products";
  const heroImageUrl = typeof hero.imageUrl === "string" ? hero.imageUrl : null;
  const heroMobileImageUrl = typeof (hero as any).mobileImageUrl === "string" ? (hero as any).mobileImageUrl : null;

  const heroTitleColor = typeof (hero as any).titleColor === "string" ? (hero as any).titleColor : null;
  const heroSubtitleColor = typeof (hero as any).subtitleColor === "string" ? (hero as any).subtitleColor : null;
  const heroPrimaryButtonBgColor =
    typeof (hero as any).primaryButtonBgColor === "string" ? (hero as any).primaryButtonBgColor : null;
  const heroPrimaryButtonTextColor =
    typeof (hero as any).primaryButtonTextColor === "string" ? (hero as any).primaryButtonTextColor : null;
  const heroSecondaryButtonBgColor =
    typeof (hero as any).secondaryButtonBgColor === "string" ? (hero as any).secondaryButtonBgColor : null;
  const heroSecondaryButtonTextColor =
    typeof (hero as any).secondaryButtonTextColor === "string" ? (hero as any).secondaryButtonTextColor : null;

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
    supabase
      .from("categories")
      .select("id,name,slug,image_url,sort_index")
      .order("sort_index", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(6),
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

  const featuredProducts = (products ?? [])
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  return (
    <main>
      {/* Hero Section - Full Width Background Banner */}
      <section className="relative overflow-hidden bg-zinc-900">
        {/* Desktop / tablet background image */}
        {heroImageUrl && (
          <div
            className="pointer-events-none absolute inset-0 hidden bg-cover bg-center sm:block"
            style={{ backgroundImage: `url(${heroImageUrl})` }}
          />
        )}

        {/* Mobile background image (falls back to desktop if not set) */}
        {(heroMobileImageUrl || heroImageUrl) && (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center sm:hidden"
            style={{ backgroundImage: `url(${heroMobileImageUrl || heroImageUrl})` }}
          />
        )}

        {/* Subtle grid texture only (no dark overlay) */}
        <div className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <div className="rounded-3xl border border-white/40 bg-white/10 p-6 shadow-xl backdrop-blur-md sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/10 px-4 py-2 text-sm text-white">
                <Sparkles className="h-4 w-4 text-yellow-400" />
                <span>New Season Collection Available</span>
              </div>
              
              <h1
                className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
                style={heroTitleColor ? { color: heroTitleColor } : { color: "#ffffff" }}
              >
                {heroTitle}
              </h1>
              
              <p
                className="mt-6 max-w-xl text-lg leading-relaxed sm:text-xl"
                style={heroSubtitleColor ? { color: heroSubtitleColor } : { color: "#e5e5e5" }}
              >
                {heroSubtitle}
              </p>
              
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-start">
                <Link 
                  href={ctaHref}
                  className="group inline-flex items-center justify-center gap-2 rounded-full border px-8 py-4 text-sm font-semibold backdrop-blur-sm transition"
                  style={{
                    backgroundColor: heroPrimaryButtonBgColor || "rgba(255,255,255,0.1)",
                    color: heroPrimaryButtonTextColor || "#ffffff",
                    borderColor: heroPrimaryButtonBgColor || "#ffffff",
                  }}
                >
                  {ctaText}
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link 
                  href="/categories"
                  className="inline-flex items-center justify-center gap-2 rounded-full border px-8 py-4 text-sm font-semibold backdrop-blur-sm transition"
                  style={{
                    backgroundColor: heroSecondaryButtonBgColor || "rgba(0,0,0,0.2)",
                    color: heroSecondaryButtonTextColor || "#ffffff",
                    borderColor: heroSecondaryButtonBgColor || "rgba(255,255,255,0.7)",
                  }}
                >
                  Browse Categories
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products (random selection) */}
      {featuredProducts.length > 0 ? (
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-3 w-3" />
                  Featured products
                </div>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                  Handpicked for you
                </h2>
                <p className="mt-2 text-lg text-zinc-600">
                  A rotating selection of popular items from the store.
                </p>
              </div>
              <Link
                href="/products"
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:mt-0"
              >
                Browse all products
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featuredProducts.map((p) => {
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
      ) : null}

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
                    className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/5 shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div
                      className={`relative h-40 w-full ${
                        bgUrl
                          ? "bg-zinc-100/40"
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
                      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-white/70 via-white/40 to-white/10 p-5">
                        <div className="text-xs font-medium uppercase tracking-wide text-zinc-700">
                          Category
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-zinc-900 sm:text-xl">
                            {card.title || cat.name}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-zinc-700">
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
                Get the latest deals
              </h2>
              <p className="mt-2 text-zinc-400">
                Share your WhatsApp number and never miss an offer.
              </p>
            </div>
            <NewsletterSignup variant="dark" source="homepage_whatsapp" />
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
