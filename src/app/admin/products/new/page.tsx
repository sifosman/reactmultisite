import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export default async function AdminNewProductPage() {
  await requireAdmin();

  return (
    <AdminShell title="New product">
      <ProductForm mode="create" />
    </AdminShell>
  );
}
