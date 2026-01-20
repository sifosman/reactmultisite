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
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpload() {
    if (files.length === 0) return;

    setError(null);
    setLoading(true);

    const uploaded: Array<{ id: string; url: string; sort_order: number }> = [];

    try {
      for (const [index, file] of files.entries()) {
        const form = new FormData();
        form.set("file", file);
        form.set("sort_order", String(images.length + index));

        const res = await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          body: form,
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error ?? "Upload failed");
        }

        const newImg = json?.image as { id: string; url: string; sort_order: number };
        if (newImg) uploaded.push(newImg);
      }

      if (uploaded.length > 0) {
        setImages((prev) => [...uploaded, ...prev]);
      }
      setFiles([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
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
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          key={`${images.length}-${files.length}`}
        />
        <button
          type="button"
          className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
          disabled={files.length === 0 || loading}
          onClick={onUpload}
        >
          {loading ? "Uploading..." : files.length > 1 ? `Upload ${files.length} images` : "Upload image"}
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
