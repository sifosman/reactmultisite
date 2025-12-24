"use client";

import { useState } from "react";

export function PayPendingOrderButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/payments/yoco/pay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setLoading(false);
      setError(json?.error ?? "Failed to initiate payment");
      return;
    }

    if (!json.redirectUrl) {
      setLoading(false);
      setError("Invalid response from payment gateway");
      return;
    }

    window.location.href = json.redirectUrl;
  }

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading ? "Redirecting to Yoco..." : "Pay with Yoco now"}
      </button>
      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
