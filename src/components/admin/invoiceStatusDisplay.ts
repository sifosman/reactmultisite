export type InvoiceStatusState = {
  status: "draft" | "issued" | "cancelled";
  payment_status?: "unpaid" | "paid" | null;
  fulfilment_status?: "pending" | "dispatched" | null;
};

export function getInvoiceStatusBadges(state: InvoiceStatusState): string[] {
  const badges: string[] = [];

  if (state.status === "draft") badges.push("Draft");
  if (state.status === "issued") badges.push("Issued");
  if (state.status === "cancelled") badges.push("Cancelled");

  const payment = state.payment_status ?? "unpaid";
  const fulfil = state.fulfilment_status ?? "pending";

  if (payment === "paid") badges.push("Paid");
  if (fulfil === "dispatched") badges.push("Dispatched");

  return badges;
}
