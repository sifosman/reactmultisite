/**
 * Centralized invoice total calculation logic
 * Ensures consistent calculation across all contexts (UI, PDF, API)
 */

export interface InvoiceLine {
  id: string;
  qty: number;
  unit_price_cents: number;
  line_total_cents: number;
}

export interface InvoiceTotals {
  subtotal_cents: number;
  delivery_cents: number;
  discount_cents: number;
  total_cents: number;
}

/**
 * Calculate invoice totals with proper validation
 */
export function calculateInvoiceTotals(
  lines: InvoiceLine[],
  delivery_cents: number = 0,
  discount_cents: number = 0
): InvoiceTotals {
  // Calculate subtotal from line items (should match sum of line_total_cents)
  const calculatedSubtotal = lines.reduce((sum, line) => {
    return sum + (line.qty * line.unit_price_cents);
  }, 0);
  
  // Also calculate from stored line_total_cents for verification
  const storedSubtotal = lines.reduce((sum, line) => {
    return sum + (line.line_total_cents || 0);
  }, 0);
  
  // Use the calculated subtotal as source of truth
  // But log if there's a discrepancy for debugging
  const subtotal_cents = calculatedSubtotal;
  
  if (calculatedSubtotal !== storedSubtotal && lines.length > 0) {
    console.warn('Invoice subtotal discrepancy:', {
      calculated: calculatedSubtotal,
      stored: storedSubtotal,
      lineCount: lines.length
    });
  }
  
  // Ensure delivery and discount are non-negative
  const valid_delivery_cents = Math.max(0, delivery_cents || 0);
  const valid_discount_cents = Math.max(0, discount_cents || 0);
  
  // Calculate total: subtotal + delivery - discount
  const total_cents = Math.max(0, subtotal_cents + valid_delivery_cents - valid_discount_cents);
  
  return {
    subtotal_cents,
    delivery_cents: valid_delivery_cents,
    discount_cents: valid_discount_cents,
    total_cents
  };
}

/**
 * Recalculate line total to ensure consistency
 */
export function calculateLineTotal(qty: number, unit_price_cents: number): number {
  const valid_qty = Math.max(0, Math.floor(qty) || 0);
  const valid_unit_price = Math.max(0, unit_price_cents || 0);
  return valid_qty * valid_unit_price;
}

/**
 * Format cents to Rands string
 */
export function formatZar(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}
