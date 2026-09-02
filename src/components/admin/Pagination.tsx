import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  /**
   * Base search params (already-parsed key/value pairs) that should be
   * preserved when navigating between pages. The `page` key is managed
   * automatically by this component.
   */
  basePath: string;
  searchParams?: Record<string, string | string[] | undefined>;
};

function buildHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
  page: number,
): string {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page") continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === "string") params.append(key, v);
        }
      } else if (typeof value === "string") {
        params.set(key, value);
      }
    }
  }
  if (page > 1) {
    params.set("page", String(page));
  } else if (params.has("page")) {
    params.delete("page");
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function getPageRange(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");

  pages.push(totalPages);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          Showing {totalItems} of {totalItems} invoice{totalItems === 1 ? "" : "s"}
        </span>
      </div>
    );
  }

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pages = getPageRange(currentPage, totalPages);

  const prevHref = buildHref(basePath, searchParams, Math.max(1, currentPage - 1));
  const nextHref = buildHref(basePath, searchParams, Math.min(totalPages, currentPage + 1));

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing {from}–{to} of {totalItems} invoices
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        {currentPage <= 1 ? (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </span>
        ) : (
          <Link
            href={prevHref}
            className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </Link>
        )}

        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex min-w-[2.25rem] items-center justify-center px-2 py-2 text-sm text-slate-400"
            >
              …
            </span>
          ) : p === currentPage ? (
            <span
              key={p}
              aria-current="page"
              className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={buildHref(basePath, searchParams, p)}
              className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {p}
            </Link>
          ),
        )}

        {currentPage >= totalPages ? (
          <span
            aria-disabled="true"
            className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-300"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <Link
            href={nextHref}
            className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </nav>
    </div>
  );
}
