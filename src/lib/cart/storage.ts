import { GuestCart, GuestCartItem } from "@/lib/cart/types";

const STORAGE_KEY = "guest_cart_v1";

function normalizeItem(item: GuestCartItem): GuestCartItem {
  return {
    productId: item.productId,
    variantId: item.variantId ?? null,
    qty: Math.max(1, Math.floor(item.qty)),
  };
}

export function readGuestCart(): GuestCart {
  if (typeof window === "undefined") {
    return { version: 1, items: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { version: 1, items: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<GuestCart>;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: [] };
    }

    return {
      version: 1,
      items: parsed.items
        .filter(Boolean)
        .map((i) => normalizeItem(i as GuestCartItem))
        .filter((i) => Boolean(i.productId) && i.qty > 0),
    };
  } catch {
    return { version: 1, items: [] };
  }
}

export function writeGuestCart(cart: GuestCart) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function addToGuestCart(next: GuestCartItem) {
  const cart = readGuestCart();
  const item = normalizeItem(next);

  const existingIdx = cart.items.findIndex(
    (i) => i.productId === item.productId && i.variantId === item.variantId
  );

  const nextItems = [...cart.items];
  if (existingIdx >= 0) {
    nextItems[existingIdx] = {
      ...nextItems[existingIdx],
      qty: nextItems[existingIdx].qty + item.qty,
    };
  } else {
    nextItems.push(item);
  }

  writeGuestCart({ version: 1, items: nextItems });
}

export function removeFromGuestCart(productId: string, variantId: string | null) {
  const cart = readGuestCart();
  const nextItems = cart.items.filter((i) => !(i.productId === productId && i.variantId === variantId));
  writeGuestCart({ version: 1, items: nextItems });
}

export function updateGuestCartQty(productId: string, variantId: string | null, qty: number) {
  const cart = readGuestCart();
  const nextItems = cart.items.map((i) => {
    if (i.productId === productId && i.variantId === variantId) {
      return { ...i, qty: Math.max(1, Math.floor(qty)) };
    }
    return i;
  });
  writeGuestCart({ version: 1, items: nextItems });
}

export function clearGuestCart() {
  writeGuestCart({ version: 1, items: [] });
}
