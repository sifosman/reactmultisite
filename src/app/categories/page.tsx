import Link from "next/link";
import { ChevronRight, Grid3X3 } from "lucide-react";
import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export const revalidate = 60;

export default async function CategoriesPage() {
  const supabase = await createPublicSupabaseServerClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id,name,slug,image_url")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-zinc-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Categories</span>
          </nav>
          
          <div className="mt-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Shop by Category
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-zinc-300">
              Browse our carefully curated collections. Find exactly what you&apos;re looking for.
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        </div>
      ) : null}

      {/* Categories Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {(categories ?? []).length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(categories ?? []).map((c, idx) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className={`group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  idx === 0 ? "sm:col-span-2 sm:row-span-2" : ""
                }`}
              >
                <div className={`${idx === 0 ? "aspect-[16/9] sm:aspect-[4/3]" : "aspect-[4/3]"} w-full overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200`}>
                  {c.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={c.image_url} 
                      alt={c.name} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className={`font-bold text-zinc-300 ${idx === 0 ? "text-8xl" : "text-6xl"}`}>
                        {c.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className={`font-bold text-white ${idx === 0 ? "text-2xl sm:text-3xl" : "text-xl"}`}>
                    {c.name}
                  </h2>
                  <div className="mt-2 flex items-center gap-1 text-sm text-white/80">
                    <span>Browse collection</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-white py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <Grid3X3 className="h-8 w-8 text-zinc-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-zinc-900">No categories yet</h3>
            <p className="mt-2 text-sm text-zinc-600">Categories will appear here once added</p>
            <Link 
              href="/products"
              className="mt-6 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              View all products
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
