import Link from "next/link";
import { Search, Filter, Eye, Download, ShoppingCart, Calendar, RefreshCw } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending_payment: "bg-yellow-100 text-yellow-700",
    paid: "bg-emerald-100 text-emerald-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return styles[status] || "bg-slate-100 text-slate-700";
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export default async function AdminOrdersPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id,status,customer_email,total_cents,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  // Calculate stats
  const totalOrders = (orders ?? []).length;
  const pendingOrders = (orders ?? []).filter(o => o.status === "pending_payment").length;
  const totalRevenue = (orders ?? []).reduce((sum, o) => sum + o.total_cents, 0);

  return (
    <AdminShell title="Orders">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
              <p className="text-sm text-slate-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <RefreshCw className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{pendingOrders}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">R{(totalRevenue / 100).toLocaleString()}</p>
              <p className="text-sm text-slate-500">Total Revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 sm:w-64"
          />
        </div>
        <div className="flex items-center gap-3">
          <select className="rounded-lg border bg-white px-4 py-2 text-sm">
            <option>All Status</option>
            <option>Pending Payment</option>
            <option>Paid</option>
            <option>Processing</option>
            <option>Shipped</option>
            <option>Delivered</option>
            <option>Cancelled</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      {/* Orders Table */}
      {(orders ?? []).length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Order ID
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
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(orders ?? []).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-mono text-sm font-medium text-slate-900">
                      #{order.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm text-slate-900">{order.customer_email}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">
                      R{(order.total_cents / 100).toFixed(2)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <ShoppingCart className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No orders yet</h3>
          <p className="mt-1 text-sm text-slate-500">Orders will appear here when customers make purchases</p>
        </div>
      )}
    </AdminShell>
  );
}
