import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";
import { getSiteConfig } from "@/lib/config/site";

export const revalidate = 0;

export default async function TermsPage() {
  const config = getSiteConfig();
  const supabase = await createPublicSupabaseServerClient();

  const { data } = await supabase
    .from("site_content")
    .select("key,data")
    .eq("key", "site")
    .maybeSingle();

  const site = (data?.data ?? {}) as Record<string, unknown>;
  const legal = (site.legal ?? {}) as Record<string, unknown>;
  const footer = (site.footer ?? {}) as Record<string, unknown>;

  const title = typeof footer.termsLabel === "string" ? footer.termsLabel : "Terms & Conditions";
  const content = typeof legal.termsContent === "string" ? legal.termsContent : "";

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{title}</h1>
      <p className="mt-2 text-sm text-zinc-600">{config.name}</p>

      {content ? (
        <div className="prose prose-zinc mt-8 max-w-none whitespace-pre-wrap">{content}</div>
      ) : (
        <div className="mt-8 rounded-xl border bg-white p-6 text-sm text-zinc-600">
          No terms content has been added yet.
        </div>
      )}
    </main>
  );
}
