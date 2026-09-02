"use client";

import { useState } from "react";

export function ResendEmailButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function onResend() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/resend-email`, {
        method: "POST",
      });

      const json = await res.json().catch(() => null);

      if (res.ok) {
        setResult({
          ok: true,
          message: `Email sent to ${json?.sentTo ?? "customer"}`,
        });
      } else {
        setResult({
          ok: false,
          message: json?.error ?? "Failed to send email",
        });
      }
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onResend}
        disabled={loading}
        className="w-full rounded-md border px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
      >
        {loading ? "Sending..." : "Resend confirmation email"}
      </button>
      {result ? (
        <div
          className={`rounded-md p-2 text-xs ${
            result.ok
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.message}
        </div>
      ) : null}
    </div>
  );
}
