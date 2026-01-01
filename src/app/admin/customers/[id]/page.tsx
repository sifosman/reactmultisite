import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, Calendar } from "lucide-react";

export const revalidate = 0;

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!customer) {
    notFound();
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id,order_number,status,total_cents,created_at")
    .eq("customer_id", params.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <AdminShell title="Customer Details">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Customer Information</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <div className="text-xs text-slate-500">Email</div>
                  <div className="text-sm font-medium text-slate-900">{customer.email}</div>
                </div>
              </div>
              {customer.full_name && (
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <span className="text-slate-400">👤</span>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Full Name</div>
                    <div className="text-sm font-medium text-slate-900">{customer.full_name}</div>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Phone</div>
                    <div className="text-sm font-medium text-slate-900">{customer.phone}</div>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-slate-500">Address</div>
                    <div className="text-sm text-slate-900 whitespace-pre-line">{customer.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Order History</h2>
            {(orders ?? []).length > 0 ? (
              <div className="mt-4 space-y-3">
                {(orders ?? []).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">#{order.order_number}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(order.created_at).toLocaleDateString("en-ZA")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">
                        R{(order.total_cents / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500">{order.status}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">
                No orders yet
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Stats</h2>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs text-slate-500">Total Orders</div>
                <div className="text-2xl font-bold text-slate-900">{customer.total_orders ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Total Spent</div>
                <div className="text-2xl font-bold text-slate-900">
                  R{((customer.total_spent_cents ?? 0) / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Member Since</div>
                <div className="text-sm font-medium text-slate-900">
                  {new Date(customer.created_at).toLocaleDateString("en-ZA")}
                </div>
              </div>
              {customer.last_order_at && (
                <div>
                  <div className="text-xs text-slate-500">Last Order</div>
                  <div className="text-sm font-medium text-slate-900">
                    {new Date(customer.last_order_at).toLocaleDateString("en-ZA")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
