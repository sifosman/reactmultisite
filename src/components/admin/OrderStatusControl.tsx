"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type OrderStatus = (typeof STATUSES)[number];

export function OrderStatusControl({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(
    (STATUSES.includes(initialStatus as OrderStatus)
      ? (initialStatus as OrderStatus)
      : "pending_payment")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave() {
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Update failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm font-medium">Order status</div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="h-10 w-full rounded-md border bg-white px-3 text-sm sm:w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
          type="button"
          disabled={loading}
          onClick={onSave}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
