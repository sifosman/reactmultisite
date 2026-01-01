"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  compact?: boolean;
};

export function DeleteCouponButton({ id, compact }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!confirm("Are you sure you want to delete this coupon? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error ?? "Failed to delete coupon");
        setLoading(false);
        return;
      }

      router.push("/admin/coupons");
      router.refresh();
    } catch (e) {
      setError("Failed to delete coupon");
      setLoading(false);
    }
  }

  if (compact) {
    return (
      <>
        {error && (
          <div className="mb-1 rounded-md border border-red-200 bg-red-50 p-1 text-xs text-red-700">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md border border-red-300 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {loading ? "Deleting..." : "Delete coupon"}
      </button>
    </div>
  );
}
