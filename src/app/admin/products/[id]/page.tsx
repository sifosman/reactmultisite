import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { EditProductClient } from "@/components/admin/EditProductClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const [{ data: product, error }, { data: categories }, { data: joins }, { data: images }] = await Promise.all([
    supabase
      .from("products")
      .select("id,name,slug,description,price_cents,compare_at_price_cents,active,has_variants,stock_qty")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id,name,slug,sort_index")
      .order("sort_index", { ascending: true, nullsFirst: false })
      .order("name", { ascending: true }),
    supabase.from("product_categories").select("category_id").eq("product_id", id),
    supabase.from("product_images").select("id,url,sort_order").eq("product_id", id).order("sort_order", { ascending: true }),
  ]);

  if (error) {
    return (
      <AdminShell title="Error loading product">
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold">Database error</div>
          <div className="mt-1 break-all text-xs">{error.message}</div>
        </div>
      </AdminShell>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <AdminShell title="Edit product">
      <EditProductClient
        productId={product.id}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          price_cents: product.price_cents,
          compare_at_price_cents: product.compare_at_price_cents,
          active: product.active,
          has_variants: product.has_variants,
          stock_qty: (product as any).stock_qty,
        }}
        categories={(categories ?? []) as { id: string; name: string; slug: string; sort_index?: number | null }[]}
        initialCategoryIds={(joins ?? []).map((j) => j.category_id)}
        initialImages={(images ?? []) as Array<{ id: string; url: string; sort_order: number }>}
      />
    </AdminShell>
  );
}
