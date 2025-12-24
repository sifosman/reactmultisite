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
    mobileImageUrl?: string;
    titleColor?: string;
    subtitleColor?: string;
    primaryButtonBgColor?: string;
    primaryButtonTextColor?: string;
    secondaryButtonBgColor?: string;
    secondaryButtonTextColor?: string;
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
  categorySections?: Array<{
    id?: string;
    title?: string;
    categorySlug?: string;
    imageUrl?: string;
  }>;
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
  contact?: {
    whatsappNumber?: string;
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
  const [promoText, setPromoText] = useState("Flat shipping R60");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [heroMobileImageUrl, setHeroMobileImageUrl] = useState<string>("");

  const [heroTitleColor, setHeroTitleColor] = useState<string>("");
  const [heroSubtitleColor, setHeroSubtitleColor] = useState<string>("");
  const [heroPrimaryButtonBgColor, setHeroPrimaryButtonBgColor] = useState<string>("");
  const [heroPrimaryButtonTextColor, setHeroPrimaryButtonTextColor] = useState<string>("");
  const [heroSecondaryButtonBgColor, setHeroSecondaryButtonBgColor] = useState<string>("");
  const [heroSecondaryButtonTextColor, setHeroSecondaryButtonTextColor] = useState<string>("");

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
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [heroMobileBannerFile, setHeroMobileBannerFile] = useState<File | null>(null);
  const [promoLeftFile, setPromoLeftFile] = useState<File | null>(null);
  const [promoRightFile, setPromoRightFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [categorySections, setCategorySections] = useState<
    Array<{ id: string; title: string; categorySlug: string; imageUrl: string }>
  >([]);
  const [categoryCardFiles, setCategoryCardFiles] = useState<Record<string, File | null>>({});
  const [allCategories, setAllCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);

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
      const contact = site.contact ?? {};

      setTitle(hero.title ?? "Affordable Finds");
      setSubtitle(hero.subtitle ?? "Shop the latest deals");
      setCtaText(hero.ctaText ?? "Shop Now");
      setCtaHref(hero.ctaHref ?? "/products");
      setPromoText(promo.text ?? "Flat shipping R60");
      setImageUrl(hero.imageUrl ?? "");
      setHeroMobileImageUrl(hero.mobileImageUrl ?? "");

      setHeroTitleColor(hero.titleColor ?? "");
      setHeroSubtitleColor(hero.subtitleColor ?? "");
      setHeroPrimaryButtonBgColor(hero.primaryButtonBgColor ?? "");
      setHeroPrimaryButtonTextColor(hero.primaryButtonTextColor ?? "");
      setHeroSecondaryButtonBgColor(hero.secondaryButtonBgColor ?? "");
      setHeroSecondaryButtonTextColor(hero.secondaryButtonTextColor ?? "");

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

      const sectionsRaw = (data.categorySections ?? []) as Array<{
        id?: string;
        title?: string;
        categorySlug?: string;
        imageUrl?: string;
      }>;
      const withIds = sectionsRaw.map((s, index) => ({
        id: s.id || `cat-card-${index + 1}`,
        title: s.title ?? "",
        categorySlug: s.categorySlug ?? "",
        imageUrl: s.imageUrl ?? "",
      }));
      setCategorySections(withIds);

      setBrandName(branding.name ?? "");
      setLogoUrl(branding.logoUrl ?? "");
      setFooterAbout(footer.about ?? "");
      setTermsLabel(footer.termsLabel ?? "Terms & Conditions");
      setTermsContent(legal.termsContent ?? "");
      setWhatsappNumber(contact.whatsappNumber ?? "");
    }

    void load();
  }, []);

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch("/api/admin/categories", { method: "GET" });
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.categories)) {
        setAllCategories(json.categories as Array<{ id: string; name: string; slug: string }>);
      }
    }

    void loadCategories();
  }, []);

  const payload = useMemo<HomepageData>(() => {
    return {
      hero: {
        title,
        subtitle,
        ctaText,
        ctaHref,
        imageUrl: imageUrl || undefined,
        mobileImageUrl: heroMobileImageUrl || undefined,
        titleColor: heroTitleColor || undefined,
        subtitleColor: heroSubtitleColor || undefined,
        primaryButtonBgColor: heroPrimaryButtonBgColor || undefined,
        primaryButtonTextColor: heroPrimaryButtonTextColor || undefined,
        secondaryButtonBgColor: heroSecondaryButtonBgColor || undefined,
        secondaryButtonTextColor: heroSecondaryButtonTextColor || undefined,
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
      categorySections:
        categorySections.length > 0
          ? categorySections.map((s) => ({
              id: s.id,
              title: s.title || undefined,
              categorySlug: s.categorySlug || undefined,
              imageUrl: s.imageUrl || undefined,
            }))
          : undefined,
    };
  }, [
    title,
    subtitle,
    ctaText,
    ctaHref,
    promoText,
    imageUrl,
    heroMobileImageUrl,
    heroTitleColor,
    heroSubtitleColor,
    heroPrimaryButtonBgColor,
    heroPrimaryButtonTextColor,
    heroSecondaryButtonBgColor,
    heroSecondaryButtonTextColor,
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
    categorySections,
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
      contact: {
        whatsappNumber: whatsappNumber || undefined,
      },
    };
  }, [brandName, logoUrl, footerAbout, termsLabel, termsContent, whatsappNumber]);

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

  async function onUploadHeroMobileBanner() {
    if (!heroMobileBannerFile) return;

    setError(null);
    setSaving(true);

    const form = new FormData();
    form.set("file", heroMobileBannerFile);

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

    setHeroMobileImageUrl(json.url);
    setHeroMobileBannerFile(null);
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

  async function onUploadCategoryCardImage(cardId: string) {
    const file = categoryCardFiles[cardId];
    if (!file) return;
    setError(null);
    setSaving(true);
    try {
      const url = await uploadPromoImage(file);
      setCategorySections((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, imageUrl: url } : c))
      );
      setCategoryCardFiles((prev) => ({ ...prev, [cardId]: null }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  function addCategorySection() {
    const id = `cat-card-${Date.now()}`;
    setCategorySections((prev) => [
      ...prev,
      { id, title: "", categorySlug: "", imageUrl: "" },
    ]);
  }

  function removeCategorySection(id: string) {
    setCategorySections((prev) => prev.filter((c) => c.id !== id));
    setCategoryCardFiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
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
            <div className="flex items-center gap-3">
              <input
                className="h-11 w-full rounded-md border bg-white px-3 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  className="h-9 w-9 cursor-pointer rounded border bg-white p-1"
                  value={heroTitleColor || "#ffffff"}
                  onChange={(e) => setHeroTitleColor(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Hero subtitle</label>
            <div className="flex items-start gap-3">
              <textarea
                className="min-h-24 w-full rounded-md border bg:white px-3 py-2 text-sm"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
              <input
                type="color"
                className="mt-1 h-9 w-9 cursor-pointer rounded border bg-white p-1"
                value={heroSubtitleColor || "#e5e5e5"}
                onChange={(e) => setHeroSubtitleColor(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CTA text</label>
            <input
              className="h-11 w-full rounded-md border bg-white px-3 text-sm"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">CTA link</label>
            <input
              className="h-11 w-full rounded-md border bg-white px-3 text-sm"
              value={ctaHref}
              onChange={(e) => setCtaHref(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Primary button colors</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-zinc-500">BG</span>
                <input
                  type="color"
                  className="h-8 w-8 cursor-pointer rounded border bg-white p-1"
                  value={heroPrimaryButtonBgColor || "#ffffff"}
                  onChange={(e) => setHeroPrimaryButtonBgColor(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-zinc-500">Text</span>
                <input
                  type="color"
                  className="h-8 w-8 cursor-pointer rounded border bg:white p-1"
                  value={heroPrimaryButtonTextColor || "#000000"}
                  onChange={(e) => setHeroPrimaryButtonTextColor(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Secondary button colors</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-zinc-500">BG</span>
                <input
                  type="color"
                  className="h-8 w-8 cursor-pointer rounded border bg:white p-1"
                  value={heroSecondaryButtonBgColor || "#000000"}
                  onChange={(e) => setHeroSecondaryButtonBgColor(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-zinc-500">Text</span>
                <input
                  type="color"
                  className="h-8 w-8 cursor-pointer rounded border bg:white p-1"
                  value={heroSecondaryButtonTextColor || "#ffffff"}
                  onChange={(e) => setHeroSecondaryButtonTextColor(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium">Promo strip text</label>
            <input
              className="h-11 w-full rounded-md border bg-white px-3 text-sm"
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
            />
          </div>
        </div>
        {/* Hero images grouped after hero text/colors */}
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
          <div className="text-sm font-semibold">Hero mobile banner image (optional)</div>
          <div className="mt-1 text-xs text-zinc-600">
            Recommended size <span className="font-mono">1080x1920</span>. Shown on mobile only. If not set, the desktop hero image is used.
          </div>

          {heroMobileImageUrl ? (
            <div className="mt-4 overflow-hidden rounded-lg border bg-white">
              <div className="aspect-[9/16] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroMobileImageUrl} alt="Hero mobile banner" className="h-full w-full object-cover" />
              </div>
              <div className="p-2 text-xs text-zinc-600 break-all">{heroMobileImageUrl}</div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-zinc-600">No mobile banner uploaded yet.</div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              id="hero-mobile-banner-file"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setHeroMobileBannerFile(e.target.files?.[0] ?? null)}
              key={heroMobileImageUrl}
            />
            <label
              htmlFor="hero-mobile-banner-file"
              className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
            >
              {heroMobileBannerFile ? "Change file" : "Choose file"}
            </label>
            <div className="text-xs text-zinc-600">
              {heroMobileBannerFile ? heroMobileBannerFile.name : "No file selected"}
            </div>
            <button
              type="button"
              className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
              disabled={!heroMobileBannerFile || saving}
              onClick={onUploadHeroMobileBanner}
            >
              {saving ? "Uploading..." : "Upload mobile banner"}
            </button>
          </div>
        </div>

        {/* Homepage category cards grouped after hero */}
        <div className="mt-6 rounded-xl border bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Homepage category cards</div>
          <div className="mt-1 text-xs text-zinc-600">
            Optional curated category sections shown on the homepage under the hero icons.
          </div>

          <div className="mt-4 space-y-4">
            {categorySections.map((card) => (
              <div key={card.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Card title (optional)</label>
                      <input
                        className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                        value={card.title}
                        onChange={(e) =>
                          setCategorySections((prev) =>
                            prev.map((c) =>
                              c.id === card.id ? { ...c, title: e.target.value } : c
                            )
                          )
                        }
                        placeholder="e.g. Shop Men, Shop Kids"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium">Linked category</label>
                      <select
                        className="h-10 w-full rounded-md border bg-white px-3 text-sm"
                        value={card.categorySlug}
                        onChange={(e) =>
                          setCategorySections((prev) =>
                            prev.map((c) =>
                              c.id === card.id ? { ...c, categorySlug: e.target.value } : c
                            )
                          )
                        }
                      >
                        <option value="">Select a category</option>
                        {allCategories.map((cat) => (
                          <option key={cat.id} value={cat.slug}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-zinc-500">
                        Category slug: {card.categorySlug || "None"}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="h-8 rounded-md border bg-white px-3 text-xs text-zinc-700 hover:bg-zinc-50"
                    onClick={() => removeCategorySection(card.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 rounded-lg border bg-zinc-50 p-3">
                  <div className="text-xs font-medium text-zinc-700">Background image</div>
                  {card.imageUrl ? (
                    <div className="mt-2 overflow-hidden rounded-md border bg-white">
                      <div className="aspect-[16/6] bg-zinc-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={card.imageUrl} alt="" className="h-full w-full object-cover" />
                      </div>
                      <div className="px-2 py-1 text-[11px] text-zinc-600 break-all">{card.imageUrl}</div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs text-zinc-500">No image uploaded yet.</div>
                  )}

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      id={`category-card-file-${card.id}`}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setCategoryCardFiles((prev) => ({ ...prev, [card.id]: file }));
                      }}
                      key={card.imageUrl}
                    />
                    <label
                      htmlFor={`category-card-file-${card.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                    >
                      {categoryCardFiles[card.id] ? "Change file" : "Choose file"}
                    </label>
                    <div className="text-xs text-zinc-600 flex-1">
                      {categoryCardFiles[card.id]
                        ? categoryCardFiles[card.id]?.name
                        : "No file selected"}
                    </div>
                    <button
                      type="button"
                      className="h-10 rounded-md bg-black px-4 text-sm text-white disabled:opacity-60"
                      disabled={!categoryCardFiles[card.id] || saving}
                      onClick={() => onUploadCategoryCardImage(card.id)}
                    >
                      {saving ? "Uploading..." : "Upload image"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              onClick={addCategorySection}
            >
              Add category card
            </button>
          </div>
        </div>

        {/* Promo cards grouped after homepage sections */}
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
