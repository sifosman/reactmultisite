import { describe, it, expect } from "vitest";
import { getSimpleProductStockMessage } from "./stockMessage";

describe("getSimpleProductStockMessage", () => {
  it("returns null when stock is null or undefined", () => {
    expect(getSimpleProductStockMessage(null)).toBeNull();
    expect(getSimpleProductStockMessage(undefined)).toBeNull();
  });

  it("returns 'Out of stock' when stock is 0 or negative", () => {
    expect(getSimpleProductStockMessage(0)).toBe("Out of stock");
    expect(getSimpleProductStockMessage(-1)).toBe("Out of stock");
  });

  it("returns 'Only X left in stock' for low stock (1-5)", () => {
    expect(getSimpleProductStockMessage(1)).toBe("Only 1 left in stock");
    expect(getSimpleProductStockMessage(3)).toBe("Only 3 left in stock");
    expect(getSimpleProductStockMessage(5)).toBe("Only 5 left in stock");
  });

  it("returns 'In stock' for higher stock levels (>5)", () => {
    expect(getSimpleProductStockMessage(6)).toBe("In stock");
    expect(getSimpleProductStockMessage(20)).toBe("In stock");
  });
});
