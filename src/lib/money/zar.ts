export const SHIPPING_CENTS = 9900;

export function formatZar(cents: number) {
  return `R${(cents / 100).toFixed(2)}`;
}
