"use client";

import { useEffect, useMemo, useState } from "react";
import { PROVINCES } from "@/lib/shipping/provinces";
import { useRouter } from "next/navigation";
import { createOrderSchema } from "@/lib/checkout/schemas";
import { readGuestCart, clearGuestCart } from "@/lib/cart/storage";
import { SHIPPING_CENTS, formatZar } from "@/lib/money/zar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
};

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  name: string | null;
  price_cents_override: number | null;
  attributes: unknown;
};

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

  const [paymentMethod, setPaymentMethod] = useState<"yoco" | "bank_transfer">("yoco");
  const [couponCode, setCouponCode] = useState("");
  const [productsById, setProductsById] = useState<Record<string, ProductRow>>({});
  const [variantsById, setVariantsById] = useState<Record<string, VariantRow>>({});

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();

      const productIds = Array.from(new Set(cart.items.map((i) => i.productId)));
      const variantIds = Array.from(new Set(cart.items.map((i) => i.variantId).filter(Boolean))) as string[];

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id,name,price_cents")
          .in("id", productIds)
          .eq("active", true);

        const next: Record<string, ProductRow> = {};
        (products ?? []).forEach((p) => {
          next[p.id] = p;
        });
        setProductsById(next);
      }

      if (variantIds.length > 0) {
        const { data: variants } = await supabase
          .from("product_variants")
          .select("id,product_id,sku,name,price_cents_override,attributes")
          .in("id", variantIds)
          .eq("active", true);

        const next: Record<string, VariantRow> = {};
        (variants ?? []).forEach((v) => {
          next[v.id] = v;
        });
        setVariantsById(next);
      }
    }

    if (cart.items.length > 0) {
      void load();
    }
  }, [cart.items]);

  const cartLines = useMemo(() => {
    return cart.items.map((item) => {
      const product = productsById[item.productId] ?? null;
      const variant = item.variantId ? variantsById[item.variantId] ?? null : null;
      const unitPriceCents = variant?.price_cents_override ?? product?.price_cents ?? 0;
      const lineTotalCents = unitPriceCents * item.qty;
      return {
        key: `${item.productId}:${item.variantId ?? "_"}`,
        item,
        product,
        variant,
        unitPriceCents,
        lineTotalCents,
      };
    });
  }, [cart.items, productsById, variantsById]);

  const subtotalCents = cartLines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const totalCents = subtotalCents + (cartLines.length > 0 ? SHIPPING_CENTS : 0);

  const canSubmit =
    cart.items.length > 0 &&
    email.length > 3 &&
    fullName.trim().length > 0 &&
    phone.trim().length > 4 &&
    line1 &&
    city &&
    province &&
    postalCode;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      customer: {
        email,
        name: fullName,
        phone,
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
      couponCode: couponCode.trim() || undefined,
    };

    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Please check your details.");
      return;
    }

    setLoading(true);

    if (paymentMethod === "yoco") {
      const res = await fetch("/api/payments/yoco/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json = await res.json().catch(() => null);
      setLoading(false);

      if (!res.ok) {
        setError(json?.error ?? "Yoco checkout failed");
        return;
      }

      if (!json.redirectUrl) {
        setError("Invalid response from payment gateway");
        return;
      }

      clearGuestCart();
      window.location.href = json.redirectUrl;
    } else {
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
      router.push(
        `/checkout/success?orderId=${encodeURIComponent(json.orderId)}&method=bank_transfer`
      );
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-wide text-black">Checkout</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-black">Details</h1>
            <div className="mt-2 text-sm text-black">Shipping is always {formatZar(SHIPPING_CENTS)}.</div>
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
            <section className="rounded-2xl border bg-white p-5 text-zinc-900 shadow-sm">
              <div className="text-sm font-semibold">Contact</div>
              <div className="mt-1 text-xs text-zinc-500">Fields marked with * are required.</div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-zinc-900">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-zinc-900">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">Payment method</div>
              <div className="mt-4 space-y-3 text-sm">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border px-3 py-3 hover:border-zinc-400 text-zinc-900">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-method"
                      className="h-4 w-4 border-zinc-400 text-black focus:ring-black"
                      checked={paymentMethod === "yoco"}
                      onChange={() => setPaymentMethod("yoco")}
                    />
                    <div>
                      <div className="font-medium">Card payment (Yoco)</div>
                      <div className="text-xs text-zinc-600">Secure card checkout powered by Yoco.</div>
                    </div>
                  </div>
                  <div className="rounded-md bg-black px-2 py-1 text-xs font-semibold text-white">Yoco</div>
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border px-3 py-3 hover:border-zinc-400">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment-method"
                      className="h-4 w-4 border-zinc-400 text-black focus:ring-black"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={() => setPaymentMethod("bank_transfer")}
                    />
                    <div>
                      <div className="font-medium">Bank transfer (EFT)</div>
                      <div className="text-xs text-zinc-600">
                        Place your order now and pay via EFT using the bank details on the next step.
                      </div>
                    </div>
                  </div>
                </label>

                {paymentMethod === "bank_transfer" ? (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <div>
                      Your order will be created with status <span className="font-semibold">pending_payment</span>.
                      Please pay via bank transfer using the bank details below and use your order ID as the
                      reference.
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-amber-900">
                      <div>
                        <span className="font-semibold">Account holder: </span>
                        <span>S Kadwa</span>
                      </div>
                      <div>
                        <span className="font-semibold">Account number: </span>
                        <span>9285283250</span>
                      </div>
                      <div>
                        <span className="font-semibold">Bank: </span>
                        <span>Absa</span>
                      </div>
                      <div>
                        <span className="font-semibold">Account type: </span>
                        <span>Savings</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-5 text-zinc-900 shadow-sm">
              <div className="text-sm font-semibold text-zinc-900">Shipping address</div>
              <div className="mt-1 text-xs text-zinc-500">Fields marked with * are required.</div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-zinc-900">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-zinc-900">
                    Address line 1 <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-zinc-900">Address line 2 (optional)</label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select a province
                    </option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">
                    Postal code <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900"
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
              className="h-12 w-full rounded-full bg-emerald-600 px-4 text-base font-semibold text-white shadow-md transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 disabled:opacity-60 disabled:shadow-none"
              disabled={!canSubmit || loading}
              type="submit"
            >
              {loading ? "Creating order..." : "Place order"}
            </button>

            <div className="text-xs text-zinc-900">
              After this step, you’ll either be redirected to Yoco hosted checkout or see bank transfer details
              depending on your selected payment method.
            </div>
          </div>

          <aside className="rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="text-sm font-semibold text-zinc-900">Order summary</div>
            <div className="mt-4 space-y-3 text-sm text-zinc-900">
              {cartLines.length === 0 ? (
                <div className="text-xs text-zinc-500">Your cart is empty.</div>
              ) : (
                cartLines.map((line) => {
                  const variantName = line.variant?.name ?? line.variant?.sku ?? "";
                  const attrs = (line.variant?.attributes ?? {}) as Record<string, unknown>;
                  const attrText = Object.keys(attrs)
                    .sort()
                    .map((k) => `${k}: ${String(attrs[k])}`)
                    .join(" • ");

                  return (
                    <div key={line.key} className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-zinc-900">
                            {line.product?.name ?? "Product"}
                          </div>
                          {variantName || attrText ? (
                            <div className="text-xs text-zinc-500">
                              {[variantName, attrText].filter(Boolean).join(" • ")}
                            </div>
                          ) : null}
                        </div>
                        <div className="text-sm font-semibold text-zinc-900">
                          {formatZar(line.lineTotalCents)}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500">Qty {line.item.qty}</div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-5 space-y-2 text-sm text-zinc-900">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatZar(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatZar(cartLines.length > 0 ? SHIPPING_CENTS : 0)}</span>
              </div>
              <div className="flex justify-between font-semibold text-zinc-900">
                <span>Total</span>
                <span>{formatZar(totalCents)}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-zinc-900">
              <label className="text-sm font-medium">Coupon code (optional)</label>
              <input
                className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="SAVE10"
              />
              <p className="text-xs text-zinc-600">Discount will be applied server-side if the code is valid.</p>
            </div>
            <div className="mt-4 rounded-xl border bg-zinc-50 p-4 text-xs text-zinc-600">
              Totals are calculated server-side on order creation.
            </div>
          </aside>
          </form>
        )}
      </div>
    </main>
  );
}
