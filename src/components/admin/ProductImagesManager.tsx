"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProductImagesManager({
  productId,
  initialImages,
}: {
  productId: string;
  initialImages: Array<{ id: string; url: string; sort_order: number }>;
}) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpload() {
    if (!file) return;

    setError(null);
    setLoading(true);

    const form = new FormData();
    form.set("file", file);
    form.set("sort_order", "0");

    const res = await fetch(`/api/admin/products/${productId}/images`, {
      method: "POST",
      body: form,
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Upload failed");
      return;
    }

    const newImg = json?.image as { id: string; url: string; sort_order: number };
    setImages((prev) => [newImg, ...prev]);
    setFile(null);
    router.refresh();
  }

  async function onDelete(imageId: string) {
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setError(json?.error ?? "Delete failed");
      return;
    }

    setImages((prev) => prev.filter((i) => i.id !== imageId));
    router.refresh();
  }

  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium">Images</div>
          <div className="mt-1 text-xs text-zinc-600">
            Upload product images (stored in Supabase Storage bucket <span className="font-mono">product-images</span>).
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          key={images.length}
        />
        <button
          type="button"
          className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
          disabled={!file || loading}
          onClick={onUpload}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => (
            <div key={img.id} className="overflow-hidden rounded-lg border bg-white">
              <div className="aspect-square bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <div className="text-[11px] text-zinc-500">Sort: {img.sort_order}</div>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 text-xs hover:bg-zinc-50"
                  disabled={loading}
                  onClick={() => onDelete(img.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>

      {images.length === 0 ? (
        <div className="mt-4 text-sm text-zinc-600">No images yet.</div>
      ) : null}
    </section>
  );
}
