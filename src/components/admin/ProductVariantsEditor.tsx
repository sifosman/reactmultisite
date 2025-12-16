"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { attributesKey, normalizeAttributes } from "@/lib/variants/utils";

type Variant = {
  id: string;
  sku: string;
  name: string | null;
  price_cents_override: number | null;
  stock_qty: number;
  active: boolean;
  attributes: Record<string, string>;
};

type AttributeDef = { name: string; values: string };

type RawVariant = {
  id: string;
  sku: string;
  name: string | null;
  price_cents_override: number | null;
  stock_qty: number;
  active: boolean;
  attributes: unknown;
};

export function ProductVariantsEditor({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [productSlug, setProductSlug] = useState<string>("");
  const [variants, setVariants] = useState<Variant[]>([]);

  const [attributes, setAttributes] = useState<AttributeDef[]>([
    { name: "Size", values: "S,M,L" },
    { name: "Color", values: "Black,White" },
  ]);

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/admin/products/${productId}/variants`, { method: "GET" });
      const json = await res.json().catch(() => null);
      setLoading(false);

      if (!res.ok) {
        setError(json?.error ?? "Failed to load variants");
        return;
      }

      setProductSlug(json.product.slug);
      setVariants(
        ((json.variants ?? []) as RawVariant[]).map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          price_cents_override: v.price_cents_override,
          stock_qty: v.stock_qty,
          active: v.active,
          attributes: normalizeAttributes(v.attributes),
        }))
      );

      // If variants exist, derive attribute suggestions like WooCommerce does.
      const derived = deriveAttributesFromVariants(json.variants ?? []);
      if (derived.length > 0) {
        setAttributes(derived);
      }
    }

    void load();
  }, [productId]);

  async function onGenerate() {
    setError(null);

    const payload = {
      attributes: attributes
        .filter((a) => a.name.trim() && a.values.trim())
        .map((a) => ({
          name: a.name.trim(),
          values: a.values
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        }))
        .filter((a) => a.values.length > 0),
    };

    const res = await fetch(`/api/admin/products/${productId}/variants`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setError(json?.error ?? "Generate failed");
      return;
    }

    router.refresh();
    // Reload list
    const reload = await fetch(`/api/admin/products/${productId}/variants`, { method: "GET" });
    const data = await reload.json().catch(() => null);
    if (reload.ok) {
      setVariants(
        ((data.variants ?? []) as RawVariant[]).map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          price_cents_override: v.price_cents_override,
          stock_qty: v.stock_qty,
          active: v.active,
          attributes: normalizeAttributes(v.attributes),
        }))
      );
    }
  }

  async function onUpdateVariant(v: Variant) {
    setError(null);
    const res = await fetch(`/api/admin/variants/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: v.sku,
        name: v.name,
        price_cents_override: v.price_cents_override,
        stock_qty: v.stock_qty,
        active: v.active,
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? "Update failed");
      return;
    }

    router.refresh();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function updateAttribute(idx: number, patch: Partial<AttributeDef>) {
    setAttributes((prev) => prev.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  }

  function addAttribute() {
    setAttributes((prev) => [...prev, { name: "", values: "" }]);
  }

  function removeAttribute(idx: number) {
    setAttributes((prev) => prev.filter((_, i) => i !== idx));
  }

  if (loading) {
    return (
      <section className="rounded-xl border bg-white p-4">
        <div className="text-sm text-zinc-600">Loading variations…</div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Variations</div>
          <div className="mt-1 text-xs text-zinc-600">
            WooCommerce-style: define attributes, generate variations, then edit stock/pricing per variation.
          </div>
        </div>
        <button className="h-10 rounded-md bg-black px-4 text-sm text-white" type="button" onClick={onGenerate}>
          Generate variations
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {saved ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
          Saved
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border bg-zinc-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Attributes</div>
          <button className="rounded-md border bg-white px-3 py-2 text-sm" type="button" onClick={addAttribute}>
            Add attribute
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {attributes.map((a, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr_auto]">
              <input
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={a.name}
                onChange={(e) => updateAttribute(idx, { name: e.target.value })}
                placeholder="Attribute name (e.g. Size)"
              />
              <input
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={a.values}
                onChange={(e) => updateAttribute(idx, { values: e.target.value })}
                placeholder="Values comma-separated (e.g. S,M,L)"
              />
              <button className="h-10 rounded-md border bg-white px-3 text-sm" type="button" onClick={() => removeAttribute(idx)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs text-zinc-600">Product: {productSlug}</div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium">Generated variations</div>
        <div className="mt-2 text-xs text-zinc-600">Edit stock and price overrides per variation.</div>

        {variants.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-600">No variations yet. Define attributes and click Generate.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {variants.map((v) => {
              const attrsText = Object.keys(v.attributes)
                .sort()
                .map((k) => `${k}: ${v.attributes[k]}`)
                .join(" • ");

              return (
                <div key={v.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">{v.name ?? v.sku}</div>
                      <div className="mt-1 text-xs text-zinc-600">{attrsText || "(no attributes)"}</div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={v.active}
                        onChange={(e) => setVariants((prev) => prev.map((x) => (x.id === v.id ? { ...x, active: e.target.checked } : x)))}
                      />
                      Active
                    </label>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-600">SKU</div>
                      <input
                        className="h-10 w-full rounded-md border px-3 text-sm"
                        value={v.sku}
                        onChange={(e) => setVariants((prev) => prev.map((x) => (x.id === v.id ? { ...x, sku: e.target.value } : x)))}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-600">Price override (cents)</div>
                      <input
                        className="h-10 w-full rounded-md border px-3 text-sm"
                        type="number"
                        min={0}
                        value={v.price_cents_override ?? ""}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x) =>
                              x.id === v.id
                                ? {
                                    ...x,
                                    price_cents_override:
                                      e.target.value === "" ? null : Number(e.target.value) || 0,
                                  }
                                : x
                            )
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-zinc-600">Stock</div>
                      <input
                        className="h-10 w-full rounded-md border px-3 text-sm"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={String(v.stock_qty)}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((x) =>
                              x.id === v.id
                                ? {
                                    ...x,
                                    stock_qty:
                                      e.target.value.replace(/\D+/g, "") === ""
                                        ? 0
                                        : Number(e.target.value.replace(/\D+/g, "")),
                                  }
                                : x
                            )
                          )
                        }
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        className="h-10 w-full rounded-md bg-black px-4 text-sm text-white"
                        type="button"
                        onClick={() => onUpdateVariant(v)}
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-zinc-600">Key: {attributesKey(v.attributes)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 text-xs text-zinc-600">
        Tip: This mirrors WooCommerce: set attributes → generate → edit each variation.
      </div>
    </section>
  );
}

function deriveAttributesFromVariants(rawVariants: unknown[]) {
  const variants = (rawVariants ?? []) as Array<{ attributes?: unknown }>;

  const map = new Map<string, Set<string>>();

  variants.forEach((v) => {
    const attrs = normalizeAttributes(v.attributes);
    for (const key of Object.keys(attrs)) {
      const set = map.get(key) ?? new Set<string>();
      set.add(attrs[key]);
      map.set(key, set);
    }
  });

  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, values]) => ({ name, values: Array.from(values).sort().join(",") }));
}
