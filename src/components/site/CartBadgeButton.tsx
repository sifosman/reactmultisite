"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { readGuestCart } from "@/lib/cart/storage";

export function CartBadgeButton({
  onClick,
}: {
  onClick: () => void;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function refresh() {
      const cart = readGuestCart();
      const c = cart.items.reduce((sum, i) => sum + i.qty, 0);
      setCount(c);
    }

    refresh();

    function onStorage(e: StorageEvent) {
      if (e.key === "guest_cart_v1") {
        refresh();
      }
    }

    window.addEventListener("storage", onStorage);

    // Same-tab updates (we write localStorage but storage event doesn't fire in same tab)
    const id = window.setInterval(refresh, 800);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(id);
    };
  }, []);

  return (
    <button
      type="button"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white text-zinc-900 hover:bg-zinc-50"
      aria-label="Cart"
      onClick={onClick}
    >
      <ShoppingBag className="h-4 w-4 text-zinc-900" />
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[11px] font-semibold text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}
