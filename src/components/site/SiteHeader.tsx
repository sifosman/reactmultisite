"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Menu, X } from "lucide-react";
import { useState } from "react";
import { CartBadgeButton } from "@/components/site/CartBadgeButton";
import { HeaderSearch } from "@/components/site/HeaderSearch";
import { getSiteConfig } from "@/lib/config/site";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { UserMenu } from "@/components/site/UserMenu";

export function SiteHeader({
  site,
}: {
  site?: {
    logoUrl?: string;
    name?: string;
  };
}) {
  const config = getSiteConfig();
  const brandName = site?.name ?? config.name;
  const logoUrl = site?.logoUrl ?? config.logo;
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {config.announcement?.enabled && (
        <div className="bg-zinc-900 text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2 text-xs">
            <div className="flex items-center gap-2">
              {config.announcement.badge && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold">
                  {config.announcement.badge}
                </span>
              )}
              <span className="text-white/90">{config.announcement.text}</span>
            </div>
            <div className="hidden items-center gap-4 sm:flex">
              <div className="rounded-full border border-white/15 px-2 py-0.5 text-white/90">EN</div>
              <div className="flex items-center gap-2 text-white/80">
                {config.social.twitter && (
                  <a className="rounded-full p-1 hover:bg-white/10" href={config.social.twitter} target="_blank" rel="noreferrer">
                    <Twitter className="h-3.5 w-3.5" />
                  </a>
                )}
                {config.social.facebook && (
                  <a className="rounded-full p-1 hover:bg-white/10" href={config.social.facebook} target="_blank" rel="noreferrer">
                    <Facebook className="h-3.5 w-3.5" />
                  </a>
                )}
                {config.social.instagram && (
                  <a className="rounded-full p-1 hover:bg-white/10" href={config.social.instagram} target="_blank" rel="noreferrer">
                    <Instagram className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white text-zinc-900 hover:bg-zinc-50 sm:hidden"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link href="/" className="shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brandName} className="h-9 w-auto" />
            ) : (
              <div className="text-base font-semibold tracking-tight">{brandName}</div>
            )}
          </Link>

          <nav className="hidden items-center gap-1 text-sm text-zinc-700 sm:flex">
            <Link className="rounded-full px-3 py-2 hover:bg-zinc-100 sm:px-4" href="/products">
              Products
            </Link>
            <Link className="rounded-full px-3 py-2 hover:bg-zinc-100 sm:px-4" href="/categories">
              Categories
            </Link>
          </nav>

          <HeaderSearch />

          <div className="ml-auto flex items-center gap-2">
            <UserMenu />
            <CartBadgeButton onClick={() => setCartOpen(true)} />
          </div>
        </div>
      </div>

      {/* Mobile slide-out navigation */}
      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 sm:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-full max-w-[320px] flex-col bg-white text-zinc-900 shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <span className="text-sm font-semibold text-zinc-900">Menu</span>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white text-zinc-900 hover:bg-zinc-50"
                onClick={() => setMobileNavOpen(false)}
              >
                <X className="h-4 w-4 text-zinc-900" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 py-4 text-sm">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    onClick={() => setMobileNavOpen(false)}
                    className="block rounded-lg px-3 py-2 font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    onClick={() => setMobileNavOpen(false)}
                    className="block rounded-lg px-3 py-2 font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    onClick={() => setMobileNavOpen(false)}
                    className="block rounded-lg px-3 py-2 font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cart"
                    onClick={() => setMobileNavOpen(false)}
                    className="block rounded-lg px-3 py-2 font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Cart
                  </Link>
                </li>
                <li>
                  <Link
                    href="/account"
                    onClick={() => setMobileNavOpen(false)}
                    className="block rounded-lg px-3 py-2 font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    Account
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
