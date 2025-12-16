"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  const [siteData, setSiteData] = useState<Record<string, unknown> | null>(null);

  if (isAdmin) {
    return <>{children}</>;
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("/api/site-content/site", { method: "GET" });
      const json = await res.json().catch(() => null);
      if (cancelled) return;
      if (!res.ok) {
        setSiteData({});
        return;
      }
      setSiteData((json?.data ?? {}) as Record<string, unknown>);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const site = useMemo(() => {
    const branding = (siteData?.branding ?? {}) as Record<string, unknown>;
    const footer = (siteData?.footer ?? {}) as Record<string, unknown>;
    const legal = (siteData?.legal ?? {}) as Record<string, unknown>;

    const name = typeof branding.name === "string" ? branding.name : undefined;
    const logoUrl = typeof branding.logoUrl === "string" ? branding.logoUrl : undefined;
    const footerAbout = typeof footer.about === "string" ? footer.about : undefined;
    const termsLabel = typeof footer.termsLabel === "string" ? footer.termsLabel : undefined;
    const hasTerms = typeof legal.termsContent === "string" && legal.termsContent.trim().length > 0;

    return {
      header: {
        name,
        logoUrl,
      },
      footer: {
        name,
        logoUrl,
        footerAbout,
        termsLabel,
        termsHref: hasTerms ? "/terms" : undefined,
      },
    };
  }, [siteData]);

  return (
    <>
      <SiteHeader site={site.header} />
      {children}
      <SiteFooter site={site.footer} />
    </>
  );
}
