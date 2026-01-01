"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { productUpsertSchema, type ProductUpsertInput } from "@/lib/admin/productSchemas";

 function centsToRandsString(cents: number) {
   return (cents / 100).toFixed(2);
 }

 function randsStringToCents(value: string) {
   const normalized = value.replaceAll(",", ".").trim();
   const num = Number(normalized);
   if (!Number.isFinite(num) || num < 0) return 0;
   return Math.round(num * 100);
 }

export function ProductForm({
  mode,
  productId,
  initial,
  onHasVariantsChange,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial?: Partial<ProductUpsertInput>;
  onHasVariantsChange?: (next: boolean) => void;
}) {
  const router = useRouter();

  const hasSale =
    (initial?.compare_at_price_cents ?? null) != null &&
    (initial?.compare_at_price_cents ?? 0) > (initial?.price_cents ?? 0);

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [regularPriceRands, setRegularPriceRands] = useState<string>(
    centsToRandsString(hasSale ? (initial?.compare_at_price_cents ?? 0) : (initial?.price_cents ?? 0))
  );
  const [salePriceRands, setSalePriceRands] = useState<string>(
    hasSale ? centsToRandsString(initial?.price_cents ?? 0) : ""
  );
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [hasVariants, setHasVariants] = useState<boolean>(initial?.has_variants ?? false);
  const [stockQty, setStockQty] = useState<number>((initial as any)?.stock_qty ?? 0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const payload = useMemo(() => {
    const regularCents = randsStringToCents(regularPriceRands);
    const saleCents = salePriceRands === "" ? null : randsStringToCents(salePriceRands);

    const finalPriceCents = saleCents != null ? saleCents : regularCents;
    const compareAtCents = saleCents != null ? regularCents : null;

    return {
      name,
      slug,
      description: description ? description : undefined,
      price_cents: finalPriceCents,
      compare_at_price_cents: compareAtCents,
      stock_qty: hasVariants ? undefined : stockQty,
      active,
      has_variants: hasVariants,
    };
  }, [name, slug, description, regularPriceRands, salePriceRands, stockQty, active, hasVariants]);

  const canSubmit = productUpsertSchema.safeParse(payload).success;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = productUpsertSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Please fix validation errors (slug must be kebab-case). ");
      return;
    }

    setLoading(true);
    const res = await fetch(
      mode === "create" ? "/api/admin/products" : `/api/admin/products/${productId}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      }
    );

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Save failed");
      return;
    }

    router.refresh();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);

    if (mode === "create") {
      const newId = json?.id as string | undefined;
      if (hasVariants && newId) {
        router.push(`/admin/products/${newId}`);
        return;
      }
    }

    router.push("/admin/products");
  }

  const formId = mode === "edit" ? `product-form-${productId ?? ""}` : undefined;

  return (
    <form id={formId} onSubmit={onSubmit} className="mt-6 space-y-6">
      <section className="rounded-xl border bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="kebab-case-slug"
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="min-h-28 w-full rounded-md border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Regular price (ZAR)</label>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={regularPriceRands}
              onChange={(e) => setRegularPriceRands(e.target.value)}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sale price (ZAR)</label>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={salePriceRands}
              onChange={(e) => setSalePriceRands(e.target.value)}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => {
                const next = e.target.checked;
                setHasVariants(next);
                onHasVariantsChange?.(next);
              }}
            />
            Has variants
          </label>

          {!hasVariants ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Stock quantity</label>
              <input
                className="h-10 w-full rounded-md border px-3 text-sm"
                value={String(stockQty)}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D+/g, "");
                  setStockQty(next === "" ? 0 : Number(next));
                }}
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        className="h-11 rounded-md bg-black px-5 text-sm text-white disabled:opacity-60"
        disabled={!canSubmit || loading}
        type="submit"
      >
        {loading ? "Saving..." : mode === "create" ? "Create product" : "Save changes"}
      </button>

      {saved ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
          Saved
        </div>
      ) : null}
    </form>
  );
}
