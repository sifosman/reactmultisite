"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatZar } from "@/lib/money/zar";

type OrderItem = {
  id: string;
  qty: number;
  unit_price_cents_snapshot: number;
  title_snapshot: string;
  variant_snapshot: unknown;
};

type OrderPayload = {
  id: string;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: string;
  customer_email: string;
  customer_name: string | null;
  created_at: string;
  items: OrderItem[];
};

type StatusResponse =
  | {
      status: string;
      pendingCheckout: {
        id: string;
        status: string;
        amount_cents: number;
        currency: string;
      };
      order: null;
    }
  | {
      status: string;
      pendingCheckout: {
        id: string;
        status: string;
        amount_cents: number;
        currency: string;
      };
      order: OrderPayload;
    };

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function YocoSuccessClient({ pendingCheckoutId }: { pendingCheckoutId: string | null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatusResponse | null>(null);

  const order = data && "order" in data ? data.order : null;

  const orderNumber = useMemo(() => {
    if (!order) return null;
    return `#${order.id.slice(0, 8).toUpperCase()}`;
  }, [order]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let finalizeCalled = false;

    async function tryFinalize(): Promise<string | null> {
      if (finalizeCalled || !pendingCheckoutId) return null;
      finalizeCalled = true;

      try {
        const res = await fetch("/api/payments/yoco/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingCheckoutId }),
        });

        const json = await res.json().catch(() => null);
        if (res.ok && json?.orderId) {
          return json.orderId as string;
        }
      } catch {
        // finalize failed — will keep polling
      }
      return null;
    }

    async function poll(attempt: number) {
      if (!pendingCheckoutId) {
        setLoading(false);
        setError("Missing checkout reference. Please contact support.");
        return;
      }

      try {
        // After 3 attempts with no order, call finalize as a fallback
        if (attempt === 3 && !finalizeCalled) {
          await tryFinalize();
        }

        const res = await fetch("/api/payments/yoco/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingCheckoutId }),
        });

        const json = (await res.json().catch(() => null)) as StatusResponse | null;

        if (cancelled) return;

        if (!res.ok || !json) {
          setError("We couldn't confirm your order yet. Please refresh this page.");
          setLoading(false);
          return;
        }

        setData(json);

        if (json.order) {
          setLoading(false);
          return;
        }

        // Give up after 30 attempts (~1-2 minutes)
        if (attempt >= 30) {
          setError(
            "Order confirmation is taking longer than expected. Please check your orders page or contact support."
          );
          setLoading(false);
          return;
        }

        const nextDelayMs = Math.min(12000, 1000 + attempt * 800);
        timer = setTimeout(() => void poll(attempt + 1), nextDelayMs);
      } catch {
        if (cancelled) return;
        const nextDelayMs = Math.min(12000, 1500 + attempt * 900);
        timer = setTimeout(() => void poll(attempt + 1), nextDelayMs);
      }
    }

    void poll(0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pendingCheckoutId]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <div className="font-semibold">Order confirmation pending</div>
        <div className="mt-2">{error}</div>
      </div>
    );
  }

  if (loading || !data || !order) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-zinc-700">
        <div className="font-semibold">Finalizing your order</div>
        <div className="mt-2 text-zinc-600">
          Payment is successful. We’re waiting for the order confirmation to complete.
        </div>
        <div className="mt-3 text-xs text-zinc-500">This page will update automatically.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <div className="font-semibold">Order confirmed</div>
        <div className="mt-1">
          Your order {orderNumber} has been placed successfully.
        </div>
        <div className="mt-2 text-green-800">
          A confirmation email will be sent to <span className="font-medium">{order.customer_email}</span>.
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-sm text-zinc-600">Order number</div>
            <div className="mt-1 font-mono text-sm text-zinc-900">{orderNumber}</div>
            <div className="mt-1 break-all font-mono text-xs text-zinc-500">{order.id}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-sm text-zinc-600">Status</div>
            <div className="mt-1 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {formatStatus(order.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm font-semibold text-zinc-900">Order summary</div>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            {(order.items ?? []).map((item) => {
              const lineTotal = item.unit_price_cents_snapshot * item.qty;
              return (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900">{item.title_snapshot}</div>
                    <div className="mt-1 text-xs text-zinc-600">Qty: {item.qty}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-zinc-900">{formatZar(lineTotal)}</div>
                    <div className="text-xs text-zinc-600">{formatZar(item.unit_price_cents_snapshot)} each</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Subtotal</span>
              <span className="text-zinc-900">{formatZar(order.subtotal_cents)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-zinc-600">Shipping</span>
              <span className="text-zinc-900">{formatZar(order.shipping_cents)}</span>
            </div>
            {order.discount_cents > 0 ? (
              <div className="mt-1 flex justify-between text-green-700">
                <span>Discount</span>
                <span>-{formatZar(order.discount_cents)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatZar(order.total_cents)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          className="rounded-md border px-4 py-2 text-sm"
          href={`/account/orders/${encodeURIComponent(order.id)}`}
        >
          View order
        </Link>
        <Link className="rounded-md border px-4 py-2 text-sm" href="/products">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
