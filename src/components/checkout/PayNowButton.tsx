"use client";

import { useState } from "react";

export function PayNowButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPay() {
    setError(null);
    setLoading(true);

    const res = await fetch("/api/payments/yoco/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Payment init failed");
      return;
    }

    window.location.href = json.redirectUrl;
  }

  return (
    <div>
      <button
        className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
        onClick={onPay}
        disabled={loading}
        type="button"
      >
        {loading ? "Redirecting..." : "Pay now (Yoco)"}
      </button>
      {error ? (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
