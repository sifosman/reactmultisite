import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getInvoiceCustomerDisplay } from "./customerDisplay";

export const revalidate = 0;

export default async function AdminInvoicesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id,invoice_number,status,total_cents,currency,created_at,customer_snapshot,payment_status,fulfilment_status")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <AdminShell title="Invoices">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">Manage invoices ({(invoices ?? []).length})</p>
        <Link
          href="/admin/invoices/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      {(invoices ?? []).length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoices ?? []).map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-slate-900">{inv.invoice_number}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(inv.created_at).toLocaleString("en-ZA")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {(() => {
                        const display = getInvoiceCustomerDisplay((inv as any).customer_snapshot ?? null);
                        return (
                          <>
                            <div className="text-slate-900">{display.primary}</div>
                            {display.secondary ? (
                              <div className="mt-1 text-xs text-slate-500">{display.secondary}</div>
                            ) : null}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {inv.status}
                        </span>
                        {inv.payment_status && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${inv.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {inv.payment_status}
                          </span>
                        )}
                        {inv.fulfilment_status && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${inv.fulfilment_status === 'dispatched' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {inv.fulfilment_status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      R{((inv.total_cents ?? 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border bg-white p-6 text-sm text-slate-500">No invoices yet.</div>
      )}
    </AdminShell>
  );
}
