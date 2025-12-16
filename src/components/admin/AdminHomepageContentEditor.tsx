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
  promoCards?: {
    left?: {
      badge?: string;
      title?: string;
      subtitle?: string;
      buttonText?: string;
      buttonHref?: string;
      imageUrl?: string;
      theme?: "amber" | "sky";
    };
    right?: {
      badge?: string;
      title?: string;
      subtitle?: string;
      buttonText?: string;
      buttonHref?: string;
      imageUrl?: string;
      theme?: "amber" | "sky";
    };
  };
};

type SiteData = {
  branding?: {
    name?: string;
    logoUrl?: string;
  };
  footer?: {
    about?: string;
    termsLabel?: string;
  };
  legal?: {
    termsContent?: string;
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

  const [promoLeftBadge, setPromoLeftBadge] = useState("Limited Time");
  const [promoLeftTitle, setPromoLeftTitle] = useState("Summer Sale");
  const [promoLeftSubtitle, setPromoLeftSubtitle] = useState("Up to 40% off selected items");
  const [promoLeftButtonText, setPromoLeftButtonText] = useState("Shop Sale");
  const [promoLeftButtonHref, setPromoLeftButtonHref] = useState("/products");
  const [promoLeftTheme, setPromoLeftTheme] = useState<"amber" | "sky">("amber");
  const [promoLeftImageUrl, setPromoLeftImageUrl] = useState<string>("");

  const [promoRightBadge, setPromoRightBadge] = useState("New Collection");
  const [promoRightTitle, setPromoRightTitle] = useState("Premium Picks");
  const [promoRightSubtitle, setPromoRightSubtitle] = useState("Discover our curated selection");
  const [promoRightButtonText, setPromoRightButtonText] = useState("Explore Now");
  const [promoRightButtonHref, setPromoRightButtonHref] = useState("/products");
  const [promoRightTheme, setPromoRightTheme] = useState<"amber" | "sky">("sky");
  const [promoRightImageUrl, setPromoRightImageUrl] = useState<string>("");

  const [brandName, setBrandName] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [footerAbout, setFooterAbout] = useState<string>("");
  const [termsLabel, setTermsLabel] = useState<string>("Terms & Conditions");
  const [termsContent, setTermsContent] = useState<string>("");

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [promoLeftFile, setPromoLeftFile] = useState<File | null>(null);
  const [promoRightFile, setPromoRightFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      const [homeRes, siteRes] = await Promise.all([
        fetch("/api/admin/site-content/homepage", { method: "GET" }),
        fetch("/api/admin/site-content/site", { method: "GET" }),
      ]);

      const [homeJson, siteJson] = await Promise.all([
        homeRes.json().catch(() => null),
        siteRes.json().catch(() => null),
      ]);

      setLoading(false);

      if (!homeRes.ok) {
        setError(homeJson?.error ?? "Failed to load homepage content");
        return;
      }

      if (!siteRes.ok) {
        setError(siteJson?.error ?? "Failed to load site content");
        return;
      }

      const data = (homeJson?.data ?? {}) as HomepageData;
      const site = (siteJson?.data ?? {}) as SiteData;
      const hero = data.hero ?? {};
      const promo = data.promoStrip ?? {};
      const promoCards = data.promoCards ?? {};
      const left = promoCards.left ?? {};
      const right = promoCards.right ?? {};
      const branding = site.branding ?? {};
      const footer = site.footer ?? {};
      const legal = site.legal ?? {};

      setTitle(hero.title ?? "Affordable Finds");
      setSubtitle(hero.subtitle ?? "Shop the latest deals");
      setCtaText(hero.ctaText ?? "Shop Now");
      setCtaHref(hero.ctaHref ?? "/products");
      setPromoText(promo.text ?? "Flat shipping R99");
      setImageUrl(hero.imageUrl ?? "");

      setPromoLeftBadge(left.badge ?? "Limited Time");
      setPromoLeftTitle(left.title ?? "Summer Sale");
      setPromoLeftSubtitle(left.subtitle ?? "Up to 40% off selected items");
      setPromoLeftButtonText(left.buttonText ?? "Shop Sale");
      setPromoLeftButtonHref(left.buttonHref ?? "/products");
      setPromoLeftTheme(left.theme === "sky" ? "sky" : "amber");
      setPromoLeftImageUrl(left.imageUrl ?? "");

      setPromoRightBadge(right.badge ?? "New Collection");
      setPromoRightTitle(right.title ?? "Premium Picks");
      setPromoRightSubtitle(right.subtitle ?? "Discover our curated selection");
      setPromoRightButtonText(right.buttonText ?? "Explore Now");
      setPromoRightButtonHref(right.buttonHref ?? "/products");
      setPromoRightTheme(right.theme === "amber" ? "amber" : "sky");
      setPromoRightImageUrl(right.imageUrl ?? "");

      setBrandName(branding.name ?? "");
      setLogoUrl(branding.logoUrl ?? "");
      setFooterAbout(footer.about ?? "");
      setTermsLabel(footer.termsLabel ?? "Terms & Conditions");
      setTermsContent(legal.termsContent ?? "");
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
      promoCards: {
        left: {
          badge: promoLeftBadge,
          title: promoLeftTitle,
          subtitle: promoLeftSubtitle,
          buttonText: promoLeftButtonText,
          buttonHref: promoLeftButtonHref,
          theme: promoLeftTheme,
          imageUrl: promoLeftImageUrl || undefined,
        },
        right: {
          badge: promoRightBadge,
          title: promoRightTitle,
          subtitle: promoRightSubtitle,
          buttonText: promoRightButtonText,
          buttonHref: promoRightButtonHref,
          theme: promoRightTheme,
          imageUrl: promoRightImageUrl || undefined,
        },
      },
    };
  }, [
    title,
    subtitle,
    ctaText,
    ctaHref,
    promoText,
    imageUrl,
    promoLeftBadge,
    promoLeftTitle,
    promoLeftSubtitle,
    promoLeftButtonText,
    promoLeftButtonHref,
    promoLeftTheme,
    promoLeftImageUrl,
    promoRightBadge,
    promoRightTitle,
    promoRightSubtitle,
    promoRightButtonText,
    promoRightButtonHref,
    promoRightTheme,
    promoRightImageUrl,
  ]);

  const sitePayload = useMemo<SiteData>(() => {
    return {
      branding: {
        name: brandName || undefined,
        logoUrl: logoUrl || undefined,
      },
      footer: {
        about: footerAbout || undefined,
        termsLabel: termsLabel || undefined,
      },
      legal: {
        termsContent: termsContent || undefined,
      },
    };
  }, [brandName, logoUrl, footerAbout, termsLabel, termsContent]);

  async function onSave() {
    setError(null);
    setSaving(true);

    const [homeRes, siteRes] = await Promise.all([
      fetch("/api/admin/site-content/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
      fetch("/api/admin/site-content/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sitePayload),
      }),
    ]);

    const [homeJson, siteJson] = await Promise.all([
      homeRes.json().catch(() => null),
      siteRes.json().catch(() => null),
    ]);

    setSaving(false);

    if (!homeRes.ok) {
      setError(homeJson?.error ?? "Save failed");
      return;
    }

    if (!siteRes.ok) {
      setError(siteJson?.error ?? "Save failed");
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

  async function onUploadLogo() {
    if (!logoFile) return;

    setError(null);
    setSaving(true);

    const form = new FormData();
    form.set("file", logoFile);

    const res = await fetch("/api/admin/uploads/logo", {
      method: "POST",
      body: form,
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Upload failed");
      return;
    }

    setLogoUrl(json.url);
    setLogoFile(null);
    router.refresh();
  }

  async function uploadPromoImage(file: File) {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/admin/uploads/banner", {
      method: "POST",
      body: form,
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.error ?? "Upload failed");
    }
    const url = json?.url as string | undefined;
    if (!url) throw new Error("Upload failed");
    return url;
  }

  async function onUploadPromoLeft() {
    if (!promoLeftFile) return;
    setError(null);
    setSaving(true);
    try {
      const url = await uploadPromoImage(promoLeftFile);
      setPromoLeftImageUrl(url);
      setPromoLeftFile(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  async function onUploadPromoRight() {
    if (!promoRightFile) return;
    setError(null);
    setSaving(true);
    try {
      const url = await uploadPromoImage(promoRightFile);
      setPromoRightImageUrl(url);
      setPromoRightFile(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
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
          <div className="text-sm font-semibold">Branding & footer</div>
          <div className="mt-1 text-xs text-zinc-600">Logo, footer copy, and legal text.</div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand name (optional override)</label>
              <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm font-medium">Logo (optional)</div>
              {logoUrl ? <div className="mt-1 text-xs text-zinc-600 break-all">{logoUrl}</div> : <div className="mt-1 text-xs text-zinc-600">No logo uploaded yet.</div>}

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  id="site-logo-file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  key={logoUrl}
                />
                <label
                  htmlFor="site-logo-file"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                >
                  {logoFile ? "Change file" : "Choose file"}
                </label>
                <div className="text-xs text-zinc-600">{logoFile ? logoFile.name : "No file selected"}</div>
                <button
                  type="button"
                  className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
                  disabled={!logoFile || saving}
                  onClick={onUploadLogo}
                >
                  {saving ? "Uploading..." : "Upload logo"}
                </button>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Footer about text</label>
              <textarea className="min-h-24 w-full rounded-md border bg-white px-3 py-2 text-sm" value={footerAbout} onChange={(e) => setFooterAbout(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Terms link label</label>
              <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={termsLabel} onChange={(e) => setTermsLabel(e.target.value)} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Terms & Conditions content</label>
              <textarea className="min-h-48 w-full rounded-md border bg-white px-3 py-2 text-sm" value={termsContent} onChange={(e) => setTermsContent(e.target.value)} />
              <div className="text-xs text-zinc-600">Displayed on <span className="font-mono">/terms</span>.</div>
            </div>
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
              id="hero-banner-file"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
              key={imageUrl}
            />
            <label
              htmlFor="hero-banner-file"
              className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
            >
              {bannerFile ? "Change file" : "Choose file"}
            </label>
            <div className="text-xs text-zinc-600">
              {bannerFile ? bannerFile.name : "No file selected"}
            </div>
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

        <div className="mt-6 rounded-xl border bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Promo cards</div>
          <div className="mt-1 text-xs text-zinc-600">Two cards shown on the homepage (under New Arrivals).</div>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm font-semibold">Left card</div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Badge</label>
                  <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoLeftBadge} onChange={(e) => setPromoLeftBadge(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Title</label>
                  <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoLeftTitle} onChange={(e) => setPromoLeftTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Subtitle</label>
                  <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoLeftSubtitle} onChange={(e) => setPromoLeftSubtitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Button text</label>
                    <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoLeftButtonText} onChange={(e) => setPromoLeftButtonText(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Button link</label>
                    <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoLeftButtonHref} onChange={(e) => setPromoLeftButtonHref(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Theme</label>
                  <select className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoLeftTheme} onChange={(e) => setPromoLeftTheme((e.target.value as "amber" | "sky") || "amber")}>
                    <option value="amber">Amber</option>
                    <option value="sky">Sky</option>
                  </select>
                </div>

                <div className="mt-2 rounded-lg border bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-600">Optional background image</div>
                  {promoLeftImageUrl ? <div className="mt-1 text-xs text-zinc-600 break-all">{promoLeftImageUrl}</div> : null}
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      id="promo-left-file"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => setPromoLeftFile(e.target.files?.[0] ?? null)}
                      key={promoLeftImageUrl}
                    />
                    <label
                      htmlFor="promo-left-file"
                      className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                    >
                      {promoLeftFile ? "Change file" : "Choose file"}
                    </label>
                    <div className="text-xs text-zinc-600">
                      {promoLeftFile ? promoLeftFile.name : "No file selected"}
                    </div>
                    <button type="button" className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60" disabled={!promoLeftFile || saving} onClick={onUploadPromoLeft}>
                      {saving ? "Uploading..." : "Upload image"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="text-sm font-semibold">Right card</div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Badge</label>
                  <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoRightBadge} onChange={(e) => setPromoRightBadge(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Title</label>
                  <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoRightTitle} onChange={(e) => setPromoRightTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Subtitle</label>
                  <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoRightSubtitle} onChange={(e) => setPromoRightSubtitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Button text</label>
                    <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoRightButtonText} onChange={(e) => setPromoRightButtonText(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Button link</label>
                    <input className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoRightButtonHref} onChange={(e) => setPromoRightButtonHref(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Theme</label>
                  <select className="h-11 w-full rounded-md border bg-white px-3 text-sm" value={promoRightTheme} onChange={(e) => setPromoRightTheme((e.target.value as "amber" | "sky") || "sky")}>
                    <option value="amber">Amber</option>
                    <option value="sky">Sky</option>
                  </select>
                </div>

                <div className="mt-2 rounded-lg border bg-zinc-50 p-3">
                  <div className="text-xs text-zinc-600">Optional background image</div>
                  {promoRightImageUrl ? <div className="mt-1 text-xs text-zinc-600 break-all">{promoRightImageUrl}</div> : null}
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      id="promo-right-file"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => setPromoRightFile(e.target.files?.[0] ?? null)}
                      key={promoRightImageUrl}
                    />
                    <label
                      htmlFor="promo-right-file"
                      className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                    >
                      {promoRightFile ? "Change file" : "Choose file"}
                    </label>
                    <div className="text-xs text-zinc-600">
                      {promoRightFile ? promoRightFile.name : "No file selected"}
                    </div>
                    <button type="button" className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60" disabled={!promoRightFile || saving} onClick={onUploadPromoRight}>
                      {saving ? "Uploading..." : "Upload image"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
