"use client";

import Link from "next/link";
import { ShoppingBag, Heart } from "lucide-react";

export function ProductCard({
  slug,
  name,
  priceCents,
  compareAtCents,
  imageUrl,
}: {
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents: number | null;
  imageUrl: string | null;
}) {
  const price = (priceCents / 100).toFixed(2);
  const compareAt = compareAtCents ? (compareAtCents / 100).toFixed(2) : null;
  const isOnSale = Boolean(compareAtCents && compareAtCents > priceCents);

  return (
    <Link
      href={`/product/${slug}`}
      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-zinc-300" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />

        {/* Sale badge */}
        {isOnSale ? (
          <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-lg">
            Sale
          </div>
        ) : null}

        {/* Wishlist button */}
        <button 
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 group-hover:opacity-100"
          onClick={(e) => {
            e.preventDefault();
            // TODO: Add to wishlist functionality
          }}
        >
          <Heart className="h-4 w-4 text-zinc-600" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-zinc-900 transition-colors group-hover:text-zinc-600">
          {name}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-zinc-900">R{price}</span>
          {compareAt ? (
            <span className="text-sm text-zinc-400 line-through">R{compareAt}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
