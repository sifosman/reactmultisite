import Link from "next/link";
import { Plus, UserPlus } from "lucide-react";
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Manage your customers ({(customers ?? []).length} total)
        </p>
        <Link
          href="/admin/customers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[780px]">
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
              <tr key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => window.location.href = `/admin/customers/${c.id}`}>
                <td className="px-6 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{c.full_name ?? c.email}</div>
                    <div className="truncate text-sm text-slate-500">{c.email}</div>
                  {c.phone ? <div className="text-xs text-slate-400">{c.phone}</div> : null}
                  </div>
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
      </div>

      {(customers ?? []).length === 0 ? (
        <div className="mt-6 rounded-xl border bg-white p-6 text-sm text-slate-500">No customers yet.</div>
      ) : null}
    </AdminShell>
  );
}
