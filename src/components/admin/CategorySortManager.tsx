"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Save, SortAsc, SortDesc, Sparkles } from "lucide-react";

type CategorySortItem = {
  id: string;
  name: string;
  slug: string;
  sort_index: number | null;
  created_at?: string | null;
};

export function CategorySortManager({
  categories,
}: {
  categories: CategorySortItem[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<CategorySortItem[]>(() => categories.slice());

  const canMoveUp = useMemo(() => items.map((_item, idx) => idx > 0), [items]);
  const canMoveDown = useMemo(() => items.map((_item, idx) => idx < items.length - 1), [items]);

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    setItems((prev) => {
      const next = prev.slice();
      const temp = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = temp;
      return next;
    });
  }

  function applyOrder(nextItems: CategorySortItem[]) {
    setItems(nextItems.slice());
  }

  function sortByName(ascending: boolean) {
    const next = items
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    applyOrder(ascending ? next : next.reverse());
  }

  function sortByNewest() {
    const next = items
      .slice()
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });
    applyOrder(next);
  }

  async function saveOrder() {
    setError(null);
    setSaving(true);

    const payload = {
      items: items.map((item, index) => ({
        id: item.id,
        sort_index: index,
      })),
    };

    const res = await fetch("/api/admin/categories/sort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to save sort order");
      return;
    }

    router.refresh();
  }

  return (
    <section className="mt-8 rounded-xl border bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Category order</div>
          <p className="mt-1 text-xs text-slate-500">
            Dragging isn’t enabled yet—use the arrows to set the manual order. Lower numbers appear first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => sortByName(true)}
          >
            <SortAsc className="h-4 w-4" />
            Name A-Z
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => sortByName(false)}
          >
            <SortDesc className="h-4 w-4" />
            Name Z-A
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={sortByNewest}
          >
            <Sparkles className="h-4 w-4" />
            Newest
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            onClick={saveOrder}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save order"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border bg-slate-50 px-3 py-2"
          >
            <div className="w-8 text-xs font-semibold text-slate-500">{index + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">{item.name}</div>
              <div className="truncate text-xs text-slate-500">/{item.slug}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                onClick={() => moveItem(index, -1)}
                disabled={!canMoveUp[index]}
                aria-label="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                onClick={() => moveItem(index, 1)}
                disabled={!canMoveDown[index]}
                aria-label="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
