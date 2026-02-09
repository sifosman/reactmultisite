"use client";

import { useMemo, useState } from "react";
import { addToGuestCart } from "@/lib/cart/storage";
import { normalizeAttributes } from "@/lib/variants/utils";

export type AddToCartVariant = {
  id: string;
  sku: string;
  name: string | null;
  stock_qty: number;
  attributes: unknown;
  price_cents_override: number | null;
};

export function AddToCart({
  productId,
  productHasVariants,
  basePriceCents,
  variants,
  simpleProductStockQty,
}: {
  productId: string;
  productHasVariants: boolean;
  basePriceCents: number;
  variants: AddToCartVariant[];
  // For simple products (no variants), optional stock quantity to enforce a max qty on the frontend
  simpleProductStockQty?: number | null;
}) {
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [qty, setQty] = useState("1");
  const [added, setAdded] = useState(false);

  const allVariants = useMemo(() => {
    return (variants ?? []).map((v) => ({
      ...v,
      attributes: normalizeAttributes(v.attributes),
    }));
  }, [variants]);

  const isVariantRequired = productHasVariants === true;

  const attributeNames = useMemo(() => {
    const set = new Set<string>();
    allVariants.forEach((v) => {
      const attrs = v.attributes as Record<string, string>;
      Object.keys(attrs).forEach((k) => set.add(k));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allVariants]);

  const attributeValues = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const name of attributeNames) {
      const set = new Set<string>();
      allVariants.forEach((v) => {
        const attrs = v.attributes as Record<string, string>;
        if (attrs[name]) set.add(attrs[name]);
      });
      map.set(name, Array.from(set).sort((a, b) => a.localeCompare(b)));
    }
    return map;
  }, [attributeNames, allVariants]);

  const selectedVariant = useMemo(() => {
    if (!isVariantRequired) return null;
    if (attributeNames.length === 0) return null;
    if (attributeNames.some((n) => !selectedAttrs[n])) return null;

    return (
      allVariants.find((v) => {
        const attrs = v.attributes as Record<string, string>;
        return attributeNames.every((n) => attrs[n] === selectedAttrs[n]);
      }) ?? null
    );
  }, [allVariants, attributeNames, isVariantRequired, selectedAttrs]);

  const isSelectedVariantInStock = selectedVariant ? selectedVariant.stock_qty > 0 : false;

  const maxSelectableQty = useMemo(() => {
    if (isVariantRequired) {
      return selectedVariant ? Math.max(0, Math.floor(selectedVariant.stock_qty)) : 0;
    }
    if (typeof simpleProductStockQty === "number") {
      return Math.max(0, Math.floor(simpleProductStockQty));
    }
    // If stock not provided for simple products, do not cap client-side
    return Number.POSITIVE_INFINITY;
  }, [isVariantRequired, selectedVariant, simpleProductStockQty]);

  const canAdd = isVariantRequired
    ? Boolean(selectedVariant && maxSelectableQty > 0)
    : maxSelectableQty > 0;

  const effectivePriceCents = (selectedVariant?.price_cents_override ?? basePriceCents) as number;

  function onAdd() {
    setAdded(false);

    const variantId = selectedVariant ? selectedVariant.id : null;
    const qtyNum = parseInt(qty) || 1;
    const cappedQty = maxSelectableQty === Number.POSITIVE_INFINITY
      ? qtyNum
      : Math.max(1, Math.min(qtyNum, maxSelectableQty));
    addToGuestCart({ productId, variantId, qty: cappedQty }, maxSelectableQty);

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  function isOptionAvailable(name: string, value: string) {
    const nextSelected: Record<string, string> = { ...selectedAttrs, [name]: value };
    return allVariants.some((v) => {
      const attrs = v.attributes as Record<string, string>;
      return v.stock_qty > 0 && Object.keys(nextSelected).every((k) => attrs[k] === nextSelected[k]);
    });
  }

  function toggleAttr(name: string, value: string) {
    setSelectedAttrs((prev) => {
      const next = { ...prev };
      if (next[name] === value) {
        delete next[name];
      } else {
        next[name] = value;
      }
      return next;
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {isVariantRequired ? (
        <div className="space-y-4">
          {attributeNames.length === 0 ? (
            <div className="text-sm text-zinc-600">No variation attributes configured.</div>
          ) : (
            attributeNames.map((name) => {
              const values = attributeValues.get(name) ?? [];
              return (
                <div key={name} className="space-y-2">
                  <div className="text-sm font-medium">{name}</div>
                  <div className="flex flex-wrap gap-2">
                    {values.map((value) => {
                      const active = selectedAttrs[name] === value;
                      const available = isOptionAvailable(name, value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleAttr(name, value)}
                          disabled={!available}
                          className={
                            "rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-40 " +
                            (active
                              ? "border-black bg-black text-white"
                              : "bg-white hover:bg-zinc-50")
                          }
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          <div className="rounded-md border bg-white p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-600">Selected price</span>
              <span className="font-semibold">R{(effectivePriceCents / 100).toFixed(2)}</span>
            </div>
            {selectedVariant ? (
              <div className="mt-2 text-xs text-zinc-600">
                SKU: {selectedVariant.sku} • Stock: {selectedVariant.stock_qty}
              </div>
            ) : (
              <div className="mt-2 text-xs text-zinc-600">Select all options to choose a variation.</div>
            )}

            {selectedVariant && !isSelectedVariantInStock ? (
              <div className="mt-2 text-xs text-red-700">
                This variation is out of stock. Update stock in admin.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1 space-y-2">
          <label className="text-sm font-medium">Qty</label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                const currentQty = parseInt(qty) || 1;
                const newQty = Math.max(1, currentQty - 1);
                setQty(newQty.toString());
              }}
              className="h-10 w-8 rounded-l-md border border-r-0 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              disabled={parseInt(qty) <= 1}
            >
              <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              className="h-10 w-full -mx-px rounded-none border px-3 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
              value={qty}
              onChange={(e) => {
                const inputValue = e.target.value;
                
                // Allow empty input or valid numbers
                if (inputValue === '' || /^\d*$/.test(inputValue)) {
                  setQty(inputValue);
                }
              }}
              onBlur={(e) => {
                const inputValue = e.target.value;
                const numValue = inputValue === '' ? 1 : parseInt(inputValue, 10);
                const finalQty = isNaN(numValue) ? 1 : Math.max(1, numValue);
                setQty(finalQty.toString());
              }}
              type="number"
              min={1}
              placeholder=""
            />
            <button
              type="button"
              onClick={() => {
                const currentQty = parseInt(qty) || 1;
                const newQty = Math.min(maxSelectableQty || 999, currentQty + 1);
                setQty(newQty.toString());
              }}
              className="h-10 w-8 rounded-r-md border border-l-0 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              disabled={maxSelectableQty !== undefined && (parseInt(qty) || 1) >= maxSelectableQty}
            >
              <svg className="mx-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        <div className="col-span-2 flex items-end">
          <button
            className="h-11 w-full rounded-full bg-orange-500 px-4 text-base font-semibold text-white shadow-md transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-60 disabled:shadow-none"
            disabled={!canAdd}
            type="button"
            onClick={onAdd}
          >
            {added ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>

      <div className="text-xs text-zinc-600">Your cart is saved locally for quick checkout.</div>
    </div>
  );
}
