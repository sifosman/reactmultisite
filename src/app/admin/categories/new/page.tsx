import { AdminShell } from "@/components/admin/AdminShell";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminNewCategoryPage() {
  await requireAdmin();

  return (
    <AdminShell title="New category">
      <CategoryForm mode="create" />
    </AdminShell>
  );
}
