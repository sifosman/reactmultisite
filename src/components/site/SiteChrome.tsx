"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";
import { FloatingWhatsAppButton } from "@/components/site/FloatingWhatsAppButton";
import { getSiteConfig } from "@/lib/config/site";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  const [siteData, setSiteData] = useState<Record<string, unknown> | null>(null);
  const config = getSiteConfig();

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
    const contact = (siteData?.contact ?? {}) as Record<string, unknown>;
    const social = (contact?.social ?? {}) as Record<string, unknown>;

    const name = typeof branding.name === "string" ? branding.name : config.name;
    const logoUrl = typeof branding.logoUrl === "string" ? branding.logoUrl : config.logo;
    const footerAbout = typeof footer.about === "string" ? footer.about : config.tagline;
    const termsLabel = typeof footer.termsLabel === "string" ? footer.termsLabel : undefined;
    const hasTerms = typeof legal.termsContent === "string" && legal.termsContent.trim().length > 0;
    const whatsappNumber = typeof contact.whatsappNumber === "string" ? contact.whatsappNumber : undefined;
    const contactEmail = typeof contact.email === "string" ? contact.email : undefined;
    const contactPhone = typeof contact.phone === "string" ? contact.phone : undefined;
    const contactAddress = typeof contact.address === "string" ? contact.address : undefined;
    const facebook = typeof social.facebook === "string" ? social.facebook : undefined;
    const instagram = typeof social.instagram === "string" ? social.instagram : undefined;
    const twitter = typeof social.twitter === "string" ? social.twitter : undefined;
    const tiktok = typeof social.tiktok === "string" ? social.tiktok : undefined;

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
        contactEmail,
        contactPhone,
        contactAddress,
        social: { facebook, instagram, twitter, tiktok },
      },
      contact: {
        whatsappNumber,
      },
    };
  }, [siteData, config]);

  if (isAdmin) {
    // For admin routes, render children without public site chrome
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader site={site.header} />
      <div className="pb-16 sm:pb-0">{children}</div>
      <SiteFooter site={site.footer} />
      <MobileBottomNav />
      <FloatingWhatsAppButton phoneNumber={site.contact.whatsappNumber} />
    </>
  );
}
