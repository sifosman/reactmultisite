"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export function ProductCategoriesEditor({
  productId,
  categories,
  initialCategoryIds,
}: {
  productId: string;
  categories: Category[];
  initialCategoryIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialCategoryIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  function slugify(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function onSave() {
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/admin/products/${productId}/categories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryIds: selected }),
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Save failed");
      return;
    }

    router.refresh();
  }

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;

    const name = createName.trim();
    const slug = (createSlug.trim() || slugify(name));

    setCreateError(null);
    setCreateLoading(true);

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, image_url: null }),
    });

    const json = await res.json().catch(() => null);
    setCreateLoading(false);

    if (!res.ok) {
      setCreateError(json?.error ?? "Create failed");
      return;
    }

    setCreateName("");
    setCreateSlug("");
    setCreating(false);
    router.refresh();
  }

  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Categories</div>
          <div className="mt-1 text-xs text-zinc-600">Assign this product to categories for browsing.</div>
        </div>
        <button
          className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
          type="button"
          onClick={onSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-600">No categories yet.</div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {sortedCategories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(c.id)}
                onChange={() => toggle(c.id)}
              />
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-zinc-500">{c.slug}</span>
            </label>
          ))}
        </div>
      )}

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}
