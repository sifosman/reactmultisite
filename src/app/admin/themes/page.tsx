import { AdminShell } from "@/components/admin/AdminShell";
import { ThemeSelector } from "@/components/admin/ThemeSelector";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const revalidate = 0;

export default async function AdminThemesPage() {
  await requireAdmin();

  return (
    <AdminShell title="Theme Selector">
      <div className="max-w-7xl">
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900">Choose Your Store Theme</h2>
          <p className="mt-1 text-sm text-slate-600">
            Select a theme that best represents your brand. Preview each theme before applying it to your store.
          </p>
        </div>
        <ThemeSelector />
      </div>
    </AdminShell>
  );
}
