export function getSimpleProductStockMessage(stockQty: number | null | undefined): string | null {
  if (stockQty == null) return null;
  if (stockQty <= 0) return "Out of stock";
  if (stockQty <= 5) return `Only ${stockQty} left in stock`;
  return "In stock";
}
