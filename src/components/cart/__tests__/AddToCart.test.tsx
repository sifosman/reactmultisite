import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddToCart } from "../AddToCart";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const addToGuestCartMock = vi.fn();

vi.mock("@/lib/cart/storage", () => ({
  addToGuestCart: (...args: any[]) => addToGuestCartMock(...args),
}));

describe("AddToCart frontend stock limiting", () => {
  beforeEach(() => {
    addToGuestCartMock.mockClear();
  });

  function renderSimpleProduct(stockQty: number) {
    render(
      <AddToCart
        productId="p1"
        productHasVariants={false}
        basePriceCents={1000}
        variants={[]}
        simpleProductStockQty={stockQty}
      />
    );
  }

  it("clamps quantity to available stock for simple products and passes capped qty to addToGuestCart", async () => {
    const user = userEvent.setup();

    renderSimpleProduct(3);

    const qtyInput = screen.getByRole("spinbutton") as HTMLInputElement;
    await user.clear(qtyInput);
    await user.type(qtyInput, "5");

    expect(qtyInput.value).toBe("3");

    const addButton = screen.getByRole("button", { name: /add to cart/i });
    await user.click(addButton);

    expect(addToGuestCartMock).toHaveBeenCalledTimes(1);
    const [itemArg, maxQtyArg] = addToGuestCartMock.mock.calls[0];
    expect(itemArg).toMatchObject({ productId: "p1", variantId: null, qty: 3 });
    expect(maxQtyArg).toBe(3);
  });
});
