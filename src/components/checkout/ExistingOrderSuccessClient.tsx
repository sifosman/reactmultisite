"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ExistingOrderSuccessClient({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    async function checkAndFinalize() {
      try {
        const res = await fetch("/api/payments/yoco/finalize-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const json = await res.json().catch(() => null);

        if (cancelled) return;

        if (res.ok && json?.status === "completed") {
          setLoading(false);
          return;
        }

        // If the order is not pending_payment (e.g. already processing), retry
        attempt++;
        if (attempt >= 10) {
          setError(
            "Order confirmation is taking longer than expected. Please check your orders page or contact support."
          );
          setLoading(false);
          return;
        }

        timer = setTimeout(() => void checkAndFinalize(), 2000);
      } catch {
        if (cancelled) return;
        attempt++;
        if (attempt >= 10) {
          setError(
            "Order confirmation is taking longer than expected. Please check your orders page or contact support."
          );
          setLoading(false);
          return;
        }
        timer = setTimeout(() => void checkAndFinalize(), 2000);
      }
    }

    void checkAndFinalize();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <div className="font-semibold">Order confirmation pending</div>
        <div className="mt-2">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-zinc-700">
        <div className="font-semibold">Finalizing your order</div>
        <div className="mt-2 text-zinc-600">
          Payment is successful. We&apos;re waiting for the order confirmation to complete.
        </div>
        <div className="mt-3 text-xs text-zinc-500">This page will update automatically.</div>
      </div>
    );
  }

  const shortId = `#${orderId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <div className="font-semibold">Payment successful</div>
        <div className="mt-1">
          Your order {shortId} has been paid successfully.
        </div>
        <div className="mt-2 text-green-800">
          A confirmation email has been sent to you.
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          className="rounded-md border px-4 py-2 text-sm"
          href={`/account/orders/${encodeURIComponent(orderId)}`}
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
