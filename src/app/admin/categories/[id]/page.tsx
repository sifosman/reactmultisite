import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminEditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: category, error } = await supabase
    .from("categories")
    .select("id,name,slug,image_url,sort_index")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!category) {
    notFound();
  }

  return (
    <AdminShell title="Edit category">
      <CategoryForm
        mode="edit"
        categoryId={category.id}
        initial={{
          name: category.name,
          slug: category.slug,
          image_url: category.image_url,
          sort_index: (category as any).sort_index ?? 0,
        }}
      />
    </AdminShell>
  );
}
