"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";

type SearchItem = {
  id: string;
  name: string;
  slug: string;
  priceCents: number;
  compareAtCents: number | null;
  imageUrl: string | null;
};

export function HeaderSearch({
  initialQuery = "",
  className,
  containerClassName,
}: {
  initialQuery?: string;
  className?: string;
  containerClassName?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLFormElement | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    const url = query ? `/products?q=${encodeURIComponent(query)}` : "/products";
    router.push(url);
  }

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    const query = q.trim();

    if (query.length < 2) {
      setItems([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: SearchItem[] };
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          setItems([]);
        }
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const showDropdown = open && q.trim().length >= 2;

  return (
    <form
      ref={wrapperRef}
      onSubmit={onSubmit}
      className={className ?? "relative hidden flex-1 sm:block"}
    >
      <div
        className={
          containerClassName
          ?? "flex h-10 items-center gap-2 rounded-full border bg-white px-3 sm:h-11 sm:px-4"
        }
      >
        <Search className="h-4 w-4 shrink-0 text-zinc-900" />
        <input
          className="w-full min-w-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
          placeholder="Search for products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>
      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-white shadow-xl">
          {items.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {items.map((item) => {
                const price = (item.priceCents / 100).toFixed(2);
                const compareAt = item.compareAtCents
                  ? (item.compareAtCents / 100).toFixed(2)
                  : null;

                return (
                  <Link
                    key={item.id}
                    href={`/product/${item.slug}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-900 transition hover:bg-zinc-50"
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-zinc-100">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.name}</p>
                      <div className="mt-1 flex items-baseline gap-2 text-xs text-zinc-500">
                        <span className="font-semibold text-zinc-900">R{price}</span>
                        {compareAt ? (
                          <span className="line-through">R{compareAt}</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-zinc-500">No matches found.</div>
          )}
          <div className="border-t bg-zinc-50">
            <Link
              href={`/products?q=${encodeURIComponent(q.trim())}`}
              className="block px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
              onClick={() => setOpen(false)}
            >
              View all results
            </Link>
          </div>
        </div>
      ) : null}
    </form>
  );
}
