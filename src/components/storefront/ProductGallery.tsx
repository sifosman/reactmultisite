"use client";

import { useMemo, useState } from "react";

export function ProductGallery({
  images,
  alt,
}: {
  images: Array<{ id: string; url: string }>;
  alt: string;
}) {
  const ordered = useMemo(() => images.filter((i) => Boolean(i.url)), [images]);
  const [active, setActive] = useState(ordered[0]?.url ?? "");

  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-zinc-100">
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">No image</div>
        )}
      </div>

      {ordered.length > 1 ? (
        <div className="mt-4 grid grid-cols-6 gap-2">
          {ordered.slice(0, 6).map((img) => {
            const isActive = img.url === active;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActive(img.url)}
                className={
                  "aspect-square overflow-hidden rounded-lg border bg-zinc-100 transition " +
                  (isActive ? "border-black ring-2 ring-black/20" : "hover:border-zinc-300")
                }
                aria-label="Select image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
