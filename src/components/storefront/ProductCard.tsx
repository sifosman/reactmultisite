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

  const discountPct =
    compareAtCents && compareAtCents > priceCents
      ? Math.round(((compareAtCents - priceCents) / compareAtCents) * 100)
      : null;

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

        {/* Discount badge */}
        {discountPct ? (
          <div className="absolute left-3 top-3 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            -{discountPct}%
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

        {/* Quick add button */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-gradient-to-t from-black/80 to-black/0 p-4 transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100">
            <ShoppingBag className="h-4 w-4" />
            Quick View
          </div>
        </div>
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

        {/* Rating placeholder */}
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-3.5 w-3.5 ${star <= 4 ? "text-yellow-400" : "text-zinc-200"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-1 text-xs text-zinc-400">(24)</span>
        </div>
      </div>
    </Link>
  );
}
