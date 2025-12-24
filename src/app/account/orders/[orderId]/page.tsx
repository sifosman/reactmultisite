import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatZar } from "@/lib/money/zar";
import { PayPendingOrderButton } from "@/components/account/PayPendingOrderButton";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      customer_email,
      customer_name,
      customer_phone,
      subtotal_cents,
      shipping_cents,
      discount_cents,
      total_cents,
      currency,
      shipping_address_snapshot,
      created_at
    `
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    console.error("Order fetch error:", error);
    console.log("User email:", user.email);
    console.log("Order ID:", orderId);
    
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Order not found</h1>
        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <div className="font-medium">Error details:</div>
            <div className="mt-1 font-mono text-xs">{error.message}</div>
          </div>
        )}
        <div className="mt-4 text-sm text-zinc-600">
          Logged in as: {user.email}
        </div>
        <div className="mt-2 text-sm text-zinc-600">
          Looking for order: {orderId}
        </div>
        <div className="mt-4">
          <Link className="text-sm text-blue-600 hover:underline" href="/account">
            ← Back to account
          </Link>
        </div>
      </main>
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id,product_id,variant_id,qty,unit_price_cents_snapshot,title_snapshot,variant_snapshot")
    .eq("order_id", orderId);

  const shippingAddress = order.shipping_address_snapshot as {
    line1?: string;
    line2?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
  };

  const statusColors: Record<string, string> = {
    pending_payment: "bg-amber-100 text-amber-800",
    paid: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusLabel: Record<string, string> = {
    pending_payment: "Pending payment",
    paid: "Paid",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link className="text-sm text-blue-600 hover:underline" href="/account">
          ← Back to account
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Order details</h1>
          <div className="mt-1 font-mono text-sm text-zinc-600">{order.id}</div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusColors[order.status] ?? "bg-gray-100 text-gray-800"
          }`}
        >
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>

      {order.status === "pending_payment" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">Payment required</div>
          <div className="mt-2 text-sm text-amber-800">
            This order is awaiting payment. Click the button below to pay securely with Yoco.
          </div>
          <div className="mt-4">
            <PayPendingOrderButton orderId={order.id} />
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Order items</div>
            <div className="mt-4 space-y-3">
              {(items ?? []).map((item) => {
                const variantInfo = item.variant_snapshot as
                  | { sku?: string; name?: string; attributes?: Record<string, string> }
                  | null;

                return (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{item.title_snapshot}</div>
                      {variantInfo?.name && (
                        <div className="text-xs text-zinc-600">{variantInfo.name}</div>
                      )}
                      {variantInfo?.attributes && (
                        <div className="text-xs text-zinc-500">
                          {Object.entries(variantInfo.attributes)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(", ")}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-zinc-600">Qty: {item.qty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatZar(item.unit_price_cents_snapshot * item.qty)}
                      </div>
                      <div className="text-xs text-zinc-600">
                        {formatZar(item.unit_price_cents_snapshot)} each
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Shipping address</div>
            <div className="mt-3 text-sm text-zinc-700">
              {order.customer_name && <div className="font-medium">{order.customer_name}</div>}
              <div>{shippingAddress.line1}</div>
              {shippingAddress.line2 && <div>{shippingAddress.line2}</div>}
              <div>
                {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
              </div>
              <div className="mt-2 text-zinc-600">{order.customer_email}</div>
              {order.customer_phone && <div className="text-zinc-600">{order.customer_phone}</div>}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Order summary</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Subtotal</span>
                <span>{formatZar(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">Shipping</span>
                <span>{formatZar(order.shipping_cents)}</span>
              </div>
              {order.discount_cents > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatZar(order.discount_cents)}</span>
                </div>
              )}
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatZar(order.total_cents)}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Timeline</div>
            <div className="mt-4 space-y-2 text-xs text-zinc-600">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(order.created_at).toLocaleString()}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
