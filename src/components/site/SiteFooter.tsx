import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, CreditCard } from "lucide-react";
import { getSiteConfig } from "@/lib/config/site";

export function SiteFooter() {
  const config = getSiteConfig();
  
  return (
    <footer className="bg-zinc-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-bold">Join Our Newsletter</h3>
              <p className="mt-2 text-zinc-400">Subscribe to get special offers, free giveaways, and updates.</p>
            </div>
            <div className="flex w-full max-w-md gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-full border-0 bg-white/10 px-5 py-3 text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <button className="shrink-0 rounded-full bg-white px-6 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-100">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-2xl font-bold">{config.name}</Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              {config.tagline}
            </p>
            
            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              {config.social.facebook && (
                <a href={config.social.facebook} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {config.social.instagram && (
                <a href={config.social.instagram} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {config.social.twitter && (
                <a href={config.social.twitter} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20">
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {!config.social.facebook && !config.social.instagram && !config.social.twitter && (
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
              <li><Link href="/products" className="text-zinc-400 transition hover:text-white">Best Sellers</Link></li>
              <li><Link href="/products" className="text-zinc-400 transition hover:text-white">Sale</Link></li>
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
              {config.email && (
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <a href={`mailto:${config.email}`} className="text-zinc-400 transition hover:text-white">{config.email}</a>
                </li>
              )}
              {config.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <a href={`tel:${config.phone}`} className="text-zinc-400 transition hover:text-white">{config.phone}</a>
                </li>
              )}
              {config.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" />
                  <span className="text-zinc-400">{config.address}</span>
                </li>
              )}
              {!config.email && !config.phone && !config.address && (
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
              © {new Date().getFullYear()} {config.name}. All rights reserved.
            </p>
            
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
