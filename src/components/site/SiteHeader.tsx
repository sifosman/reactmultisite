import Link from "next/link";
import { Facebook, Instagram, Twitter, User } from "lucide-react";
import { CartBadgeButton } from "@/components/site/CartBadgeButton";
import { HeaderSearch } from "@/components/site/HeaderSearch";
import { getSiteConfig } from "@/lib/config/site";

export function SiteHeader() {
  const config = getSiteConfig();
  
  return (
    <header className="sticky top-0 z-40">
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
          <Link href="/" className="shrink-0 text-base font-semibold tracking-tight">
            {config.name}
          </Link>

          <nav className="flex items-center gap-1 text-sm text-zinc-700">
            <Link className="rounded-full px-3 py-2 hover:bg-zinc-100 sm:px-4" href="/products">
              Products
            </Link>
            <Link className="rounded-full px-3 py-2 hover:bg-zinc-100 sm:px-4" href="/categories">
              Categories
            </Link>
          </nav>

          <HeaderSearch />

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/account"
              className="hidden h-10 w-10 items-center justify-center rounded-full border bg-white hover:bg-zinc-50 sm:inline-flex"
              aria-label="Account"
            >
              <User className="h-4 w-4" />
            </Link>
            <CartBadgeButton />
          </div>
        </div>
      </div>
    </header>
  );
}
