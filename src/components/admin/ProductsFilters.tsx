"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";

type SortOption =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "stock_asc"
  | "stock_desc";

type StatusOption = "all" | "active" | "inactive";

export function ProductsFilters({
  initialQ,
  initialStatus,
  initialSort,
}: {
  initialQ: string;
  initialStatus: StatusOption;
  initialSort: SortOption;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState<StatusOption>(initialStatus);
  const [sort, setSort] = useState<SortOption>(initialSort);

  const currentParams = useMemo(() => new URLSearchParams(searchParams?.toString()), [searchParams]);

  function apply(next: { q?: string; status?: StatusOption; sort?: SortOption }) {
    const p = new URLSearchParams(currentParams);

    const nextQ = (next.q ?? q).trim();
    const nextStatus = next.status ?? status;
    const nextSort = next.sort ?? sort;

    if (nextQ) p.set("q", nextQ);
    else p.delete("q");

    if (nextStatus && nextStatus !== "all") p.set("status", nextStatus);
    else p.delete("status");

    if (nextSort && nextSort !== "newest") p.set("sort", nextSort);
    else p.delete("sort");

    router.push(`${pathname}?${p.toString()}`);
    router.refresh();
  }

  function clearAll() {
    setQ("");
    setStatus("all");
    setSort("newest");
    router.push(pathname);
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <form
        className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
      >
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:w-64"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          aria-expanded={open}
          aria-controls="products-filter-panel"
        >
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </div>

      {open ? (
        <div
          id="products-filter-panel"
          className="rounded-xl border bg-white p-4 shadow-sm sm:col-span-2"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900"
                value={status}
                onChange={(e) => {
                  const v = e.target.value as StatusOption;
                  setStatus(v);
                  apply({ status: v });
                }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sort by</label>
              <select
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900"
                value={sort}
                onChange={(e) => {
                  const v = e.target.value as SortOption;
                  setSort(v);
                  apply({ sort: v });
                }}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name_asc">Name: A → Z</option>
                <option value="name_desc">Name: Z → A</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="stock_asc">Stock: Low → High</option>
                <option value="stock_desc">Stock: High → Low</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => {
                  apply({ q, status, sort });
                  setOpen(false);
                }}
                className="h-10 rounded-lg bg-black px-4 text-sm font-medium text-white"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setOpen(false);
                }}
                className="h-10 rounded-lg border bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
