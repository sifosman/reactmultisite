"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/categories", label: "Categories", Icon: LayoutGrid },
  { href: "/cart", label: "Cart", Icon: ShoppingBag },
  { href: "/account", label: "Account", Icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur sm:hidden">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-4">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={
                "flex flex-col items-center justify-center gap-1 text-xs font-medium " +
                (active ? "text-zinc-900" : "text-zinc-500")
              }
              aria-label={label}
            >
              <Icon className={"h-5 w-5 " + (active ? "text-zinc-900" : "text-zinc-500")} />
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
