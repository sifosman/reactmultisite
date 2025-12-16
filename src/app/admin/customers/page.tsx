import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminCustomersPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id,email,full_name,phone,total_orders,total_spent_cents,last_order_at,created_at")
    .order("updated_at", { ascending: false })
    .limit(500);

  return (
    <AdminShell title="Customers">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Total spent</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Last order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(customers ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">{c.full_name ?? c.email}</div>
                  <div className="text-sm text-slate-500">{c.email}</div>
                  {c.phone ? <div className="text-xs text-slate-400">{c.phone}</div> : null}
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">{c.total_orders}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  R{((c.total_spent_cents ?? 0) / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {c.last_order_at ? new Date(c.last_order_at).toLocaleString("en-ZA") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(customers ?? []).length === 0 ? (
        <div className="mt-6 rounded-xl border bg-white p-6 text-sm text-slate-500">No customers yet.</div>
      ) : null}
    </AdminShell>
  );
}
