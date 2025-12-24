import Link from "next/link";
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  MoreHorizontal
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();

  const [{ count: productsCount }, { count: ordersCount }, { data: recentOrders }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id,status,customer_email,total_cents,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Calculate total revenue from recent orders
  const totalRevenue = (recentOrders ?? []).reduce((sum, o) => sum + o.total_cents, 0);

  const stats = [
    {
      title: "Total Revenue",
      value: `R${(totalRevenue / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Total Orders",
      value: ordersCount?.toString() ?? "0",
      icon: ShoppingCart,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Products",
      value: productsCount?.toString() ?? "0",
      icon: Package,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

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

  return (
    <AdminShell title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.iconBg}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-sm text-slate-500">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="mt-8 rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Orders</h3>
            <p className="text-sm text-slate-500">Latest customer orders</p>
          </div>
          <Link 
            href="/admin/orders" 
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            View All Orders
          </Link>
        </div>

        {(recentOrders ?? []).length > 0 ? (
          <div className="overflow-x-auto">
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
                {(recentOrders ?? []).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-sm text-slate-900">
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
                        {new Date(order.created_at).toLocaleDateString("en-ZA")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-medium text-slate-900">No orders yet</h3>
            <p className="mt-1 text-sm text-slate-500">Orders will appear here when customers make purchases</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
