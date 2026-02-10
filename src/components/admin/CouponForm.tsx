"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CouponData = {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value_cents?: number;
  max_uses?: number;
  expires_at?: string;
  active: boolean;
};

export function CouponForm({
  mode,
  couponId,
  initial,
}: {
  mode: "create" | "edit";
  couponId?: string;
  initial?: Partial<CouponData>;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initial?.code ?? "");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    initial?.discount_type ?? "percentage"
  );
  const [discountValue, setDiscountValue] = useState(
    initial?.discount_value?.toString() ?? ""
  );
  const [minOrderValue, setMinOrderValue] = useState(
    initial?.min_order_value_cents ? (initial.min_order_value_cents / 100).toFixed(2) : ""
  );
  const [maxUses, setMaxUses] = useState(initial?.max_uses?.toString() ?? "");
  let initialExpires = "";
  if (initial?.expires_at) {
    const d = new Date(initial.expires_at);
    if (!isNaN(d.getTime())) {
      initialExpires = d.toISOString().split("T")[0];
    }
  }
  const [expiresAt, setExpiresAt] = useState(initialExpires);
  const [active, setActive] = useState(initial?.active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!code || !discountValue) {
      setError("Code and discount value are required");
      return;
    }

    const numericValue = parseFloat(discountValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      setError("Discount value must be a positive number");
      return;
    }

    if (discountType === "percentage" && numericValue > 100) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: discountType === "percentage" 
          ? Math.round(numericValue) 
          : Math.round(numericValue * 100),
        active,
      };

      if (minOrderValue) {
        const minValue = parseFloat(minOrderValue);
        if (!isNaN(minValue) && minValue > 0) {
          payload.min_order_value_cents = Math.round(minValue * 100);
        }
      }

      if (maxUses) {
        const maxValue = parseInt(maxUses);
        if (!isNaN(maxValue) && maxValue > 0) {
          payload.max_uses = maxValue;
        }
      }

      if (expiresAt) {
        // Send raw date string; API/DB will handle casting to timestamptz or date
        payload.expires_at = expiresAt;
      }

      const res = await fetch(
        mode === "create" ? "/api/admin/coupons" : `/api/admin/coupons/${couponId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error ?? "Failed to save coupon");
        setLoading(false);
        return;
      }

      router.push("/admin/coupons");
      router.refresh();
    } catch (err) {
      setError("Failed to save coupon");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Coupon Details</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-gray-700">Coupon Code *</label>
            <input
              type="text"
              className="h-10 w-full rounded-md border px-3 text-sm font-mono uppercase text-gray-900"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SAVE20"
              required
            />
            <p className="text-xs text-gray-500">Code will be automatically converted to uppercase</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Discount Type *</label>
            <select
              className="h-10 w-full rounded-md border px-3 text-sm text-gray-900"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (R)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Discount Value * {discountType === "percentage" ? "(%)" : "(R)"}
            </label>
            <input
              type="text"
              inputMode="decimal"
              className="h-10 w-full rounded-md border px-3 text-sm text-gray-900"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percentage" ? "10" : "50.00"}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Minimum Order Value (R)</label>
            <input
              type="text"
              inputMode="decimal"
              className="h-10 w-full rounded-md border px-3 text-sm text-gray-900"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              placeholder="100.00"
            />
            <p className="text-xs text-gray-500">Optional - leave blank for no minimum</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Maximum Uses</label>
            <input
              type="text"
              inputMode="numeric"
              className="h-10 w-full rounded-md border px-3 text-sm text-gray-900"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ""))}
              placeholder="100"
            />
            <p className="text-xs text-gray-500">Optional - leave blank for unlimited</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Expiration Date</label>
            <input
              type="date"
              className="h-10 w-full rounded-md border px-3 text-sm text-gray-900"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            <p className="text-xs text-gray-500">Optional - leave blank for no expiration</p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="font-medium text-gray-900">Active</span>
            </label>
            <p className="text-xs text-gray-500">Inactive coupons cannot be used by customers</p>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-md bg-black px-5 text-sm text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : mode === "create" ? "Create Coupon" : "Save Changes"}
      </button>
    </form>
  );
}
