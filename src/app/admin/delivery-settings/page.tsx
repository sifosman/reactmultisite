import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { DeliverySettingsForm } from "@/components/admin/DeliverySettingsForm";

export const revalidate = 0;

export default async function AdminDeliverySettingsPage() {
  await requireAdmin();

  return (
    <AdminShell title="Delivery settings">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DeliverySettingsForm />
        </div>
        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-4 text-sm text-slate-700">
            <div className="text-sm font-semibold text-slate-900">How it works</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600">
              <li>Flat rate is the default delivery fee for all provinces.</li>
              <li>Per-province mode lets you override the fee for specific provinces.</li>
              <li>Orders use the province from the customer shipping address.</li>
            </ul>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
