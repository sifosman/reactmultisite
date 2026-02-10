"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function InfiniteLoadMore({
  hasMore,
  nextHref,
}: {
  hasMore: boolean;
  nextHref: string;
}) {
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const lastNavigatedHrefRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canLoad = useMemo(() => hasMore && !isLoading, [hasMore, isLoading]);

  useEffect(() => {
    if (!hasMore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    lastNavigatedHrefRef.current = null;
  }, [hasMore, nextHref]);

  useEffect(() => {
    if (!canLoad) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!hasMore) return;
        if (lastNavigatedHrefRef.current === nextHref) return;

        lastNavigatedHrefRef.current = nextHref;
        setIsLoading(true);
        router.push(nextHref, { scroll: false });
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoad, hasMore, nextHref, router]);

  return (
    <div className="mt-12">
      <div ref={sentinelRef} />
      <div className="text-center">
        <button
          type="button"
          disabled={!hasMore || isLoading}
          onClick={() => {
            if (!hasMore) return;
            if (lastNavigatedHrefRef.current === nextHref) return;
            lastNavigatedHrefRef.current = nextHref;
            setIsLoading(true);
            router.push(nextHref, { scroll: false });
          }}
          className="inline-flex rounded-full border-2 border-zinc-200 bg-white px-8 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Loading…" : "Load more products"}
        </button>
      </div>
    </div>
  );
}
