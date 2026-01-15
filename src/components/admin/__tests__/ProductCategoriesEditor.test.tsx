import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ProductCategoriesEditor } from "../ProductCategoriesEditor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

function renderWithCategories(categories: Array<{ id: string; name: string; slug: string; sort_index?: number | null }>) {
  render(
    <ProductCategoriesEditor
      productId="p1"
      categories={categories}
      initialCategoryIds={[]}
    />
  );
}

describe("ProductCategoriesEditor category ordering", () => {
  it("orders categories by sort_index (ascending) and falls back to name", () => {
    const categories = [
      { id: "1", name: "Bags", slug: "bags", sort_index: 5 },
      { id: "2", name: "Accessories", slug: "accessories", sort_index: 1 },
      { id: "3", name: "Clothing", slug: "clothing", sort_index: 3 },
    ];

    renderWithCategories(categories);

    const labels = screen.getAllByRole("checkbox").map((checkbox) => {
      const label = checkbox.closest("label");
      if (!label) return "";
      // First span inside the label is the category name
      const nameSpan = label.querySelector("span.font-medium");
      return nameSpan?.textContent ?? "";
    });

    expect(labels).toEqual(["Accessories", "Clothing", "Bags"]);
  });
});
