"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { readGuestCart, clearGuestCart, removeFromGuestCart } from "@/lib/cart/storage";
import type { GuestCartItem } from "@/lib/cart/types";
import { formatZar, SHIPPING_CENTS } from "@/lib/money/zar";

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

export function CartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [productsById, setProductsById] = useState<Record<string, ProductRow>>({});
  const [variantsById, setVariantsById] = useState<Record<string, VariantRow>>({});

  useEffect(() => {
    function refresh() {
      setItems(readGuestCart().items);
    }

    refresh();

    function onStorage(e: StorageEvent) {
      if (e.key === "guest_cart_v1") {
        refresh();
      }
    }

    window.addEventListener("storage", onStorage);

    const id = window.setInterval(refresh, 800);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(id);
    };
  }, []);

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
      } else {
        setProductsById({});
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
      } else {
        setVariantsById({});
      }
    }

    if (items.length > 0) {
      void load();
    } else {
      setProductsById({});
      setVariantsById({});
    }
  }, [items]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (!open) return;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

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

  function onClear() {
    clearGuestCart();
    setItems([]);
  }

  function onRemove(productId: string, variantId: string | null) {
    removeFromGuestCart(productId, variantId);
    setItems(readGuestCart().items);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-sm font-semibold text-black">Cart</div>
          <button
            type="button"
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-black hover:bg-zinc-50"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-black" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="rounded-xl border bg-zinc-50 p-4 text-sm text-zinc-900">Your cart is empty.</div>
          ) : (
            <div className="space-y-3">
              {lines.map((l) => {
                const attrs = (l.variant?.attributes ?? {}) as Record<string, unknown>;
                const attrText = Object.keys(attrs)
                  .sort()
                  .map((k) => `${k}: ${String(attrs[k])}`)
                  .join(" • ");

                return (
                  <div key={l.key} className="rounded-xl border bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-zinc-900">
                          {l.product?.name ?? "(Missing product)"}
                        </div>
                        {l.variant ? (
                          <div className="mt-1 text-xs text-zinc-900">
                            {l.variant.name ?? l.variant.sku}
                            {attrText ? ` • ${attrText}` : ""}
                          </div>
                        ) : null}
                        <div className="mt-2 text-xs text-zinc-900">Qty: {l.item.qty}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-zinc-900">{formatZar(l.lineTotalCents)}</div>
                        <div className="mt-1 text-xs text-zinc-900">{formatZar(l.unitPriceCents)} each</div>
                        <button
                          type="button"
                          className="mt-3 text-xs text-red-600 hover:underline"
                          onClick={() => onRemove(l.item.productId, l.item.variantId)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t px-5 py-4">
          <div className="space-y-2 text-sm text-zinc-900">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{formatZar(subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-medium">{lines.length > 0 ? formatZar(SHIPPING_CENTS) : formatZar(0)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>{formatZar(totalCents)}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-11 items-center justify-center rounded-full border bg-white px-4 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Clear cart
            </button>
            <Link
              href="/cart"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-full border bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              View Cart
            </Link>
            <Link
              href="/checkout"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-full bg-orange-500 px-4 text-base font-semibold text-white shadow-md transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
            >
              Checkout
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
