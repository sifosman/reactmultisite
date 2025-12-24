"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  clearGuestCart,
  readGuestCart,
  removeFromGuestCart,
  updateGuestCartQty,
} from "@/lib/cart/storage";
import type { GuestCartItem } from "@/lib/cart/types";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  price_cents: number;
};

type VariantRow = {
  id: string;
  product_id: string;
  sku: string;
  name: string | null;
  price_cents_override: number | null;
  stock_qty: number;
  attributes: unknown;
};

type CartLine = {
  key: string;
  item: GuestCartItem;
  product: ProductRow | null;
  variant: VariantRow | null;
  unitPriceCents: number;
  lineTotalCents: number;
};

const SHIPPING_CENTS = 6000;

export function CartClient() {
  const [items, setItems] = useState<GuestCartItem[]>(() => readGuestCart().items);
  const [productsById, setProductsById] = useState<Record<string, ProductRow>>({});
  const [variantsById, setVariantsById] = useState<Record<string, VariantRow>>({});

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowserClient();

      const productIds = Array.from(new Set(items.map((i) => i.productId)));
      const variantIds = Array.from(new Set(items.map((i) => i.variantId).filter(Boolean))) as string[];

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id,name,slug,price_cents")
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
          .select("id,product_id,sku,name,price_cents_override,stock_qty,attributes")
          .in("id", variantIds)
          .eq("active", true);

        const next: Record<string, VariantRow> = {};
        (variants ?? []).forEach((v) => {
          next[v.id] = v;
        });
        setVariantsById(next);
      }
    }

    if (items.length > 0) {
      void load();
    } else {
      queueMicrotask(() => {
        setProductsById({});
        setVariantsById({});
      });
    }
  }, [items]);

  const lines: CartLine[] = useMemo(() => {
    return items.map((item) => {
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
  }, [items, productsById, variantsById]);

  const subtotalCents = lines.reduce((sum, l) => sum + l.lineTotalCents, 0);
  const totalCents = subtotalCents + (lines.length > 0 ? SHIPPING_CENTS : 0);

  function onRemove(productId: string, variantId: string | null) {
    removeFromGuestCart(productId, variantId);
    setItems(readGuestCart().items);
  }

  function onQtyChange(productId: string, variantId: string | null, qty: number) {
    updateGuestCartQty(productId, variantId, qty);
    setItems(readGuestCart().items);
  }

  function onClear() {
    clearGuestCart();
    setItems([]);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide text-zinc-800">Checkout</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Cart</h1>
          <div className="mt-2 text-sm text-zinc-800">Premium checkout. ZAR only.</div>
        </div>
        <div className="flex gap-2">
          <Link className="rounded-full border bg-white px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-50" href="/products">
            Continue shopping
          </Link>
          <button
            className="rounded-full border bg-white px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-50"
            type="button"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-white p-6 text-sm text-zinc-900 shadow-sm">
          Your cart is empty.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-3">
            {lines.map((l) => {
              const unit = (l.unitPriceCents / 100).toFixed(2);
              const total = (l.lineTotalCents / 100).toFixed(2);

              const attrs = (l.variant?.attributes ?? {}) as Record<string, unknown>;
              const attrText = Object.keys(attrs)
                .sort()
                .map((k) => `${k}: ${String(attrs[k])}`)
                .join(" • ");

              return (
                <div key={l.key} className="rounded-2xl border bg-white p-5 text-zinc-900 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs text-zinc-800">Item</div>
                      <div className="mt-1 text-sm font-semibold text-zinc-900">{l.product?.name ?? "(Missing product)"}</div>
                      {l.variant ? (
                        <div className="mt-1 text-xs text-zinc-800">
                          {l.variant.name ?? l.variant.sku}
                          {attrText ? ` • ${attrText}` : ""}
                        </div>
                      ) : null}
                      <div className="mt-2 text-xs text-zinc-800">Unit: R{unit}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">R{total}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          className="h-10 w-20 rounded-full border bg-white px-3 text-sm text-zinc-900"
                          type="number"
                          min={1}
                          value={l.item.qty}
                          onChange={(e) => onQtyChange(l.item.productId, l.item.variantId, Number(e.target.value))}
                        />
                        <button
                          className="h-10 rounded-full border bg-white px-4 text-sm text-zinc-900 hover:bg-zinc-50"
                          type="button"
                          onClick={() => onRemove(l.item.productId, l.item.variantId)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <aside className="rounded-2xl border bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <div className="text-sm font-semibold text-zinc-900">Summary</div>
            <div className="mt-4 space-y-2 text-sm text-zinc-900">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R{(subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>R{(SHIPPING_CENTS / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>R{(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-zinc-900">
              Totals shown here are for display only. Checkout recalculates totals server-side.
            </div>
            <Link
              className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-orange-500 px-4 text-base font-semibold text-white shadow-md transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
              href="/checkout"
            >
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
