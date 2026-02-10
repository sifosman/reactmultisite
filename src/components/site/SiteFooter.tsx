"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, MapPin, Phone, CreditCard, Mail } from "lucide-react";
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

  const contactEmail = "thecoastalwarehouse@gmail.com";
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
              <p className="mt-2 text-zinc-400">Share your WhatsApp number and you will be added to WhatsApp group for daily updates.</p>
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
              <span>Coast Warehouse</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {footerAbout}
            </p>
            
            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {/* Instagram */}
              <a href="https://www.instagram.com/coastal_warehouse?igsh=aG13dnlrNWN6ejRq" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                <Instagram className="h-5 w-5" />
              </a>
              {/* WhatsApp */}
              <a href="https://wa.me/27713456393" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              {/* Google */}
              <a href="https://share.google/ClaGG8feui971W2bu" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </a>
              {/* Takealot */}
              <a href="https://www.takealot.com/seller/the-coastal-warehouse?sellers=29894938" target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </a>
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
