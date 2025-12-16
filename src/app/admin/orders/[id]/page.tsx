import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const [{ data: order, error: orderError }, { data: items }, { data: payments }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id,status,customer_email,customer_name,customer_phone,subtotal_cents,shipping_cents,discount_cents,total_cents,currency,created_at,shipping_address_snapshot"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id,qty,unit_price_cents_snapshot,title_snapshot,variant_snapshot")
      .eq("order_id", id),
    supabase
      .from("payments")
      .select("id,provider,provider_payment_id,status,amount_cents,currency,created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (orderError) {
    throw new Error(orderError.message);
  }

  if (!order) {
    notFound();
  }

  const address = (order.shipping_address_snapshot ?? {}) as Record<string, unknown>;

  return (
    <AdminShell title="Order detail">
      <div className="mb-6">
        <Link className="text-sm text-zinc-600 hover:underline" href="/admin/orders">
          Back to orders
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-600">Order</div>
            <div className="mt-1 break-all font-mono text-xs">{order.id}</div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs text-zinc-600">Customer</div>
                <div className="text-sm font-medium">{order.customer_email}</div>
                {order.customer_name ? (
                  <div className="text-sm text-zinc-600">{order.customer_name}</div>
                ) : null}
                {order.customer_phone ? (
                  <div className="text-sm text-zinc-600">{order.customer_phone}</div>
                ) : null}
              </div>
              <div>
                <div className="text-xs text-zinc-600">Totals</div>
                <div className="text-sm">Subtotal: R{(order.subtotal_cents / 100).toFixed(2)}</div>
                <div className="text-sm">Shipping: R{(order.shipping_cents / 100).toFixed(2)}</div>
                <div className="text-sm">Discount: R{(order.discount_cents / 100).toFixed(2)}</div>
                <div className="text-sm font-semibold">Total: R{(order.total_cents / 100).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium">Items</div>
            <div className="mt-4 space-y-3">
              {(items ?? []).map((i) => {
                const v = (i.variant_snapshot ?? {}) as Record<string, unknown>;
                const vName = typeof v.name === "string" ? ` (${v.name})` : "";
                return (
                  <div key={i.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium">{i.title_snapshot}{vName}</div>
                        <div className="mt-1 text-xs text-zinc-600">Qty: {i.qty}</div>
                      </div>
                      <div className="text-sm font-semibold">
                        R{((i.unit_price_cents_snapshot * i.qty) / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium">Shipping address</div>
            <div className="mt-3 text-sm text-zinc-700">
              <div>{String(address.line1 ?? "")}</div>
              {address.line2 ? <div>{String(address.line2)}</div> : null}
              <div>
                {String(address.city ?? "")} {String(address.province ?? "")} {String(address.postal_code ?? "")}
              </div>
              <div>{String(address.country ?? "ZA")}</div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium">Payments</div>
            <div className="mt-4 space-y-3">
              {(payments ?? []).length === 0 ? (
                <div className="text-sm text-zinc-600">No payments yet.</div>
              ) : (
                (payments ?? []).map((p) => (
                  <div key={p.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium">{p.provider}</div>
                        <div className="mt-1 text-xs text-zinc-600">Status: {p.status}</div>
                        {p.provider_payment_id ? (
                          <div className="mt-1 break-all font-mono text-xs text-zinc-600">
                            {p.provider_payment_id}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold">R{(p.amount_cents / 100).toFixed(2)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <OrderStatusControl orderId={order.id} initialStatus={order.status} />

          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-zinc-600">Current status</div>
            <div className="mt-1 text-lg font-semibold">{order.status}</div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
