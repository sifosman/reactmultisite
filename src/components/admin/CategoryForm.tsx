"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { categoryUpsertSchema, type CategoryUpsertInput } from "@/lib/admin/categorySchemas";

export function CategoryForm({
  mode,
  categoryId,
  initial,
}: {
  mode: "create" | "edit";
  categoryId?: string;
  initial?: Partial<CategoryUpsertInput>;
}) {
  const router = useRouter();

  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [imageUrl, setImageUrl] = useState<string>(initial?.image_url ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = useMemo(() => {
    return {
      name,
      slug,
      image_url: imageUrl ? imageUrl : null,
    };
  }, [name, slug, imageUrl]);

  const canSubmit = categoryUpsertSchema.safeParse(payload).success;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = categoryUpsertSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Please fix validation errors (slug must be kebab-case). ");
      return;
    }

    setLoading(true);
    const res = await fetch(
      mode === "create" ? "/api/admin/categories" : `/api/admin/categories/${categoryId}`,
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
    router.push("/admin/categories");
  }

  async function onDelete() {
    if (mode !== "edit" || !categoryId) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this category? This will unlink it from any products."
    );
    if (!confirmed) return;

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error ?? "Delete failed");
        setLoading(false);
        return;
      }
      router.refresh();
      router.push("/admin/categories");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setLoading(false);
    }
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
            <label className="text-sm font-medium">Image URL (optional)</label>
            <input
              className="h-10 w-full rounded-md border px-3 text-sm"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          className="h-11 rounded-md bg-black px-5 text-sm text-white disabled:opacity-60"
          disabled={!canSubmit || loading}
          type="submit"
        >
          {loading ? "Saving..." : mode === "create" ? "Create category" : "Save changes"}
        </button>
        {mode === "edit" && categoryId ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="h-11 rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Delete category
          </button>
        ) : null}
      </div>
    </form>
  );
}
