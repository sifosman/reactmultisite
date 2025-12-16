"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type HomepageData = {
  hero?: {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaHref?: string;
    imageUrl?: string;
  };
  promoStrip?: {
    text?: string;
  };
};

export function AdminHomepageContentEditor() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("Affordable Finds");
  const [subtitle, setSubtitle] = useState("Shop the latest deals");
  const [ctaText, setCtaText] = useState("Shop Now");
  const [ctaHref, setCtaHref] = useState("/products");
  const [promoText, setPromoText] = useState("Flat shipping R99");
  const [imageUrl, setImageUrl] = useState<string>("");

  const [bannerFile, setBannerFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/admin/site-content/homepage", { method: "GET" });
      const json = await res.json().catch(() => null);
      setLoading(false);

      if (!res.ok) {
        setError(json?.error ?? "Failed to load homepage content");
        return;
      }

      const data = (json?.data ?? {}) as HomepageData;
      const hero = data.hero ?? {};
      const promo = data.promoStrip ?? {};

      setTitle(hero.title ?? "Affordable Finds");
      setSubtitle(hero.subtitle ?? "Shop the latest deals");
      setCtaText(hero.ctaText ?? "Shop Now");
      setCtaHref(hero.ctaHref ?? "/products");
      setPromoText(promo.text ?? "Flat shipping R99");
      setImageUrl(hero.imageUrl ?? "");
    }

    void load();
  }, []);

  const payload = useMemo<HomepageData>(() => {
    return {
      hero: {
        title,
        subtitle,
        ctaText,
        ctaHref,
        imageUrl: imageUrl || undefined,
      },
      promoStrip: {
        text: promoText,
      },
    };
  }, [title, subtitle, ctaText, ctaHref, promoText, imageUrl]);

  async function onSave() {
    setError(null);
    setSaving(true);

    const res = await fetch("/api/admin/site-content/homepage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Save failed");
      return;
    }

    router.refresh();
  }

  async function onUploadBanner() {
    if (!bannerFile) return;

    setError(null);
    setSaving(true);

    const form = new FormData();
    form.set("file", bannerFile);

    const res = await fetch("/api/admin/uploads/banner", {
      method: "POST",
      body: form,
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Upload failed");
      return;
    }

    setImageUrl(json.url);
    setBannerFile(null);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6">
        <div className="text-sm text-zinc-600">Loading content…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <div className="text-sm font-semibold">Homepage</div>
        <div className="mt-1 text-xs text-zinc-600">
          Edit homepage hero and promo strip. Changes are live immediately.
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Hero title</label>
            <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Hero subtitle</label>
            <textarea className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CTA text</label>
            <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CTA link</label>
            <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Promo strip text</label>
            <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoText} onChange={(e) => setPromoText(e.target.value)} />
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Hero banner image (optional)</div>
          <div className="mt-1 text-xs text-zinc-600">Uploads to the Supabase Storage bucket <span className="font-mono">banners</span>.</div>

          {imageUrl ? (
            <div className="mt-4 overflow-hidden rounded-lg border bg-white">
              <div className="aspect-[16/6] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Hero banner" className="h-full w-full object-cover" />
              </div>
              <div className="p-2 text-xs text-zinc-600 break-all">{imageUrl}</div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-zinc-600">No banner uploaded yet.</div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              key={imageUrl}
            />
            <button
              type="button"
              className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
              disabled={!bannerFile || saving}
              onClick={onUploadBanner}
            >
              {saving ? "Uploading..." : "Upload banner"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            className="h-11 rounded-full bg-black px-6 text-sm font-semibold text-white disabled:opacity-60"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
