"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderSchema } from "@/lib/checkout/schemas";
import { readGuestCart, clearGuestCart } from "@/lib/cart/storage";
import { SHIPPING_CENTS, formatZar } from "@/lib/money/zar";

export function CheckoutClient() {
  const router = useRouter();
  const cart = useMemo(() => readGuestCart(), []);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = cart.items.length > 0 && email.length > 3 && line1 && city && province && postalCode;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      customer: {
        email,
        name: fullName || undefined,
        phone: phone || undefined,
      },
      shippingAddress: {
        line1,
        line2: line2 || undefined,
        city,
        province,
        postal_code: postalCode,
        country: "ZA",
      },
      items: cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        qty: i.qty,
      })),
    };

    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Please check your details.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Checkout failed");
      return;
    }

    clearGuestCart();
    router.push(`/checkout/success?orderId=${encodeURIComponent(json.orderId)}`);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-zinc-500">Checkout</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Details</h1>
          <div className="mt-2 text-sm text-zinc-600">Shipping is always {formatZar(SHIPPING_CENTS)}.</div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="rounded-full bg-black px-3 py-1.5 font-semibold text-white">1. Details</div>
          <div className="rounded-full border bg-white px-3 py-1.5 text-zinc-600">2. Payment</div>
        </div>
      </div>

      {cart.items.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-white p-6 text-sm text-zinc-600 shadow-sm">
          Your cart is empty.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Contact</div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full name (optional)</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone (optional)</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Shipping address</div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Address line 1</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">Address line 2 (optional)</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Province</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal code</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              className="h-11 w-full rounded-full bg-black px-4 text-sm font-semibold text-white disabled:opacity-60"
              disabled={!canSubmit || loading}
              type="submit"
            >
              {loading ? "Creating order..." : "Proceed to payment"}
            </button>

            <div className="text-xs text-zinc-600">
              After this step, you’ll be redirected to Yoco hosted checkout.
            </div>
          </div>

          <aside className="rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="text-sm font-semibold">Order summary</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-600">Shipping</span>
                <span>{formatZar(SHIPPING_CENTS)}</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl border bg-zinc-50 p-4 text-xs text-zinc-600">
              Totals are calculated server-side on order creation.
            </div>
          </aside>
        </form>
      )}
    </main>
  );
}
