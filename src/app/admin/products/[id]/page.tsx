import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductCategoriesEditor } from "@/components/admin/ProductCategoriesEditor";
import { ProductImagesManager } from "@/components/admin/ProductImagesManager";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
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
      .select("id,name,slug,description,price_cents,compare_at_price_cents,active,has_variants")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id,name,slug").order("name", { ascending: true }),
    supabase.from("product_categories").select("category_id").eq("product_id", id),
    supabase.from("product_images").select("id,url,sort_order").eq("product_id", id).order("sort_order", { ascending: true }),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  if (!product) {
    notFound();
  }

  return (
    <AdminShell title="Edit product">
      <div className="space-y-6">
        <ProductForm
          mode="edit"
          productId={product.id}
          initial={{
            name: product.name,
            slug: product.slug,
            description: product.description ?? "",
            price_cents: product.price_cents,
            compare_at_price_cents: product.compare_at_price_cents,
            active: product.active,
            has_variants: product.has_variants,
          }}
        />

        <ProductCategoriesEditor
          productId={product.id}
          categories={(categories ?? []) as { id: string; name: string; slug: string }[]}
          initialCategoryIds={(joins ?? []).map((j) => j.category_id)}
        />

        <ProductImagesManager
          productId={product.id}
          initialImages={(images ?? []) as Array<{ id: string; url: string; sort_order: number }>}
        />

        {product.has_variants ? <ProductVariantsEditor productId={product.id} /> : null}
      </div>
    </AdminShell>
  );
}
