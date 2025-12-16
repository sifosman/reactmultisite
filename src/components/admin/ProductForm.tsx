"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { productUpsertSchema, type ProductUpsertInput } from "@/lib/admin/productSchemas";

export function ProductForm({
  mode,
  productId,
  initial,
}: {
  mode: "create" | "edit";
  productId?: string;
  initial?: Partial<ProductUpsertInput>;
}) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceCents, setPriceCents] = useState<number>(initial?.price_cents ?? 0);
  const [compareAtCents, setCompareAtCents] = useState<number | "">(
    initial?.compare_at_price_cents ?? ""
  );
  const [active, setActive] = useState<boolean>(initial?.active ?? true);
  const [hasVariants, setHasVariants] = useState<boolean>(initial?.has_variants ?? false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    return {
      name,
      slug,
      description: description ? description : undefined,
      price_cents: Number(priceCents),
      compare_at_price_cents: compareAtCents === "" ? null : Number(compareAtCents),
      active,
      has_variants: hasVariants,
    };
  }, [name, slug, description, priceCents, compareAtCents, active, hasVariants]);

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
    router.push("/admin/products");
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-6">
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
            <label className="text-sm font-medium">Price (cents)</label>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={priceCents}
              onChange={(e) => setPriceCents(Number(e.target.value) || 0)}
              type="number"
              min={0}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Compare-at (cents)</label>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={compareAtCents}
              onChange={(e) => setCompareAtCents(e.target.value === "" ? "" : Number(e.target.value) || 0)}
              type="number"
              min={0}
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
              onChange={(e) => setHasVariants(e.target.checked)}
            />
            Has variants
          </label>
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
    </form>
  );
}
