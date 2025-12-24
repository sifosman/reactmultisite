"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteAllProductsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  async function handleDeleteAll() {
    const confirmed = window.confirm(
      "Delete all products that have never been used in an order? This cannot be undone. Orders will be kept."
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/delete-all", {
        method: "POST",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        window.alert(json?.error ?? "Bulk delete failed");
        setLoading(false);
        return;
      }
      const count = json?.deletedCount ?? 0;
      window.alert(`Deleted ${count} products that were not used in any orders.`);
      startTransition(() => {
        router.refresh();
      });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Bulk delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDeleteAll}
      disabled={loading || pending}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
    >
      Delete all products
    </button>
  );
}
