import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { BulkProductUpload } from "@/components/admin/BulkProductUpload";

export default async function AdminBulkProductsPage() {
  await requireAdmin();

  return (
    <AdminShell title="Bulk upload products">
      <BulkProductUpload />
    </AdminShell>
  );
}
