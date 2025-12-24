import { createPublicSupabaseServerClient } from "@/lib/storefront/publicClient";

export const revalidate = 0;

export default async function ShippingPage() {
  const supabase = await createPublicSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("data")
    .eq("key", "site")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const site = (data?.data ?? {}) as Record<string, unknown>;
  const pages = (site.pages ?? {}) as Record<string, unknown>;
  const body = typeof pages.shipping === "string" ? pages.shipping : "";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Shipping Information</h1>
      {body ? (
        <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{body}</div>
      ) : null}
    </main>
  );
}
