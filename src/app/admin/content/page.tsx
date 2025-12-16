import { AdminShell } from "@/components/admin/AdminShell";
import { AdminHomepageContentEditor } from "@/components/admin/AdminHomepageContentEditor";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const revalidate = 0;

export default async function AdminContentPage() {
  await requireAdmin();

  return (
    <AdminShell title="Content">
      <AdminHomepageContentEditor />
    </AdminShell>
  );
}
