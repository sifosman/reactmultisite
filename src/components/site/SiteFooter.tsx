"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, MapPin, Phone, CreditCard, Mail } from "lucide-react";
import { getSiteConfig } from "@/lib/config/site";
import { NewsletterSignup } from "@/components/site/NewsletterSignup";

export function SiteFooter({
  site,
}: {
  site?: {
    logoUrl?: string;
    name?: string;
    tagline?: string;
    footerAbout?: string;
    termsHref?: string;
    termsLabel?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    social?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      tiktok?: string;
    };
  };
}) {
  const config = getSiteConfig();
  const brandName = site?.name ?? config.name;
  const logoUrl = site?.logoUrl ?? config.logo;
  const footerAbout = site?.footerAbout ?? site?.tagline ?? config.tagline;
  const termsHref = site?.termsHref;
  const termsLabel = site?.termsLabel ?? "Terms";

  const contactEmail = site?.contactEmail ?? config.email;
  const contactPhone = site?.contactPhone ?? config.phone;
  const contactAddress = site?.contactAddress ?? config.address;

  const social = site?.social ?? config.social;
  
  return (
    <footer className="bg-zinc-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold">Join our WhatsApp group</h3>
              <p className="mt-2 text-zinc-400">Share your WhatsApp number to get special offers, updates, and news.</p>
            </div>
            <NewsletterSignup variant="dark" source="footer_whatsapp" />
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 text-2xl font-bold">
              {logoUrl ? (
                <Image 
                  src={logoUrl} 
                  alt={brandName} 
                  width={120} 
                  height={36}
                  className="h-9 w-auto"
                />
              ) : null}
              <span>{brandName}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {footerAbout}
            </p>
            
            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {social.twitter && (
                <a href={social.twitter} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              <a href="https://www.instagram.com/coastal_warehouse?igsh=aG13dnlrNWN6ejRq" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                <Instagram className="h-5 w-5" />
              </a>
              {!social.facebook && !social.instagram && !social.twitter && (
                <>
                  <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                    <Twitter className="h-5 w-5" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">Quick Links</h4>
            <ul className="mt-6 space-y-3">
              <li><Link href="/products" className="text-zinc-400 transition hover:text-white">All Products</Link></li>
              <li><Link href="/categories" className="text-zinc-400 transition hover:text-white">Categories</Link></li>
              <li><Link href="/products" className="text-zinc-400 transition hover:text-white">New Arrivals</Link></li>
              <li><Link href="/category/sale" className="text-zinc-400 transition hover:text-white">Sale</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">Customer Service</h4>
            <ul className="mt-6 space-y-3">
              <li><Link href="/contact" className="text-zinc-400 transition hover:text-white">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-zinc-400 transition hover:text-white">Shipping Information</Link></li>
              <li><Link href="/returns" className="text-zinc-400 transition hover:text-white">Returns & Exchanges</Link></li>
              <li><Link href="/faq" className="text-zinc-400 transition hover:text-white">FAQ</Link></li>
              <li><Link href="/track-order" className="text-zinc-400 transition hover:text-white">Track Your Order</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">Contact Us</h4>
            <ul className="mt-6 space-y-4">
              {contactEmail && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <a href={`mailto:${contactEmail}`} className="text-zinc-400 transition hover:text:white">{contactEmail}</a>
                </li>
              )}
              {contactPhone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <a href={`tel:${contactPhone}`} className="text-zinc-400 transition hover:text-white">{contactPhone}</a>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <span className="text-zinc-400 whitespace-pre-wrap">{contactAddress}</span>
                </li>
              )}
              {!contactEmail && !contactPhone && !contactAddress && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <span className="text-zinc-400">hello@example.com</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-zinc-400">
              © {new Date().getFullYear()} <a href="https://owdsolutions.co.za" target="_blank" rel="noreferrer" className="text-zinc-300 underline-offset-4 hover:underline">OWD Solutions</a>. All rights reserved.
            </p>

            {termsHref ? (
              <div className="flex items-center gap-4 text-sm">
                <Link href={termsHref} className="text-zinc-400 transition hover:text-white">
                  {termsLabel}
                </Link>
              </div>
            ) : null}
            
            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">We accept:</span>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-12 items-center justify-center rounded bg-white/10">
                  <CreditCard className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="flex h-8 items-center justify-center rounded bg-white/10 px-2 text-xs font-semibold text-zinc-400">
                  VISA
                </div>
                <div className="flex h-8 items-center justify-center rounded bg-white/10 px-2 text-xs font-semibold text-zinc-400">
                  MC
                </div>
                <div className="flex h-8 items-center justify-center rounded bg-white/10 px-2 text-xs font-semibold text-zinc-400">
                  EFT
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
