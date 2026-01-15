import { describe, it, expect, beforeEach } from "vitest";
import { addToGuestCart, readGuestCart, clearGuestCart } from "./storage";

function installMockLocalStorage() {
  const store = new Map<string, string>();
  window.localStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
  } as Storage;
}

describe("addToGuestCart with maxQty", () => {
  beforeEach(() => {
    installMockLocalStorage();
    clearGuestCart();
  });

  it("does not exceed maxQty when adding a new item", () => {
    addToGuestCart({ productId: "p1", variantId: null, qty: 10 }, 5);
    const cart = readGuestCart();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ productId: "p1", variantId: null, qty: 5 });
  });

  it("does not exceed maxQty when adding to an existing item", () => {
    addToGuestCart({ productId: "p1", variantId: null, qty: 3 }, 5);
    addToGuestCart({ productId: "p1", variantId: null, qty: 4 }, 5);
    const cart = readGuestCart();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ productId: "p1", variantId: null, qty: 5 });
  });

  it("falls back to min 1 when maxQty is not provided", () => {
    addToGuestCart({ productId: "p1", variantId: null, qty: 0 });
    const cart = readGuestCart();
    expect(cart.items[0].qty).toBe(1);
  });
});
