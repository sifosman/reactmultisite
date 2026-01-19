"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HeaderSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    const url = query ? `/products?q=${encodeURIComponent(query)}` : "/products";
    router.push(url);
  }

  return (
    <form onSubmit={onSubmit} className="hidden flex-1 sm:block">
      <div className="flex h-10 items-center gap-2 rounded-full border bg-white px-3 sm:h-11 sm:px-4">
        <Search className="h-4 w-4 shrink-0 text-zinc-900" />
        <input
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-zinc-500"
          placeholder="Search for products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
    </form>
  );
}
