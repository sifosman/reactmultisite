"use client";

import { SlidersHorizontal } from "lucide-react";

export function SortSelect({ defaultValue, formId }: { defaultValue: string; formId: string }) {
  return (
    <div className="flex items-center gap-2">
      <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
      <select
        name="sort"
        form={formId}
        defaultValue={defaultValue}
        onChange={(e) => {
          const form = document.getElementById(formId) as HTMLFormElement;
          if (form) form.submit();
        }}
        className="rounded-lg border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm focus:border-zinc-400 focus:ring-zinc-400"
      >
        <option value="featured">Sort by: Featured</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="newest">Newest First</option>
      </select>
    </div>
  );
}
