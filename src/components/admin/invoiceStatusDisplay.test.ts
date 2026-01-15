import { describe, it, expect } from "vitest";
import { getInvoiceStatusBadges } from "./invoiceStatusDisplay";

describe("getInvoiceStatusBadges", () => {
  it("shows basic status only when unpaid/pending", () => {
    expect(getInvoiceStatusBadges({ status: "issued", payment_status: "unpaid", fulfilment_status: "pending" })).toEqual([
      "Issued",
    ]);
  });

  it("includes Paid when payment_status is paid", () => {
    expect(getInvoiceStatusBadges({ status: "issued", payment_status: "paid", fulfilment_status: "pending" })).toEqual([
      "Issued",
      "Paid",
    ]);
  });

  it("includes Dispatched when fulfilment_status is dispatched", () => {
    expect(getInvoiceStatusBadges({ status: "issued", payment_status: "unpaid", fulfilment_status: "dispatched" })).toEqual([
      "Issued",
      "Dispatched",
    ]);
  });

  it("includes both Paid and Dispatched when both flags are set", () => {
    expect(getInvoiceStatusBadges({ status: "issued", payment_status: "paid", fulfilment_status: "dispatched" })).toEqual([
      "Issued",
      "Paid",
      "Dispatched",
    ]);
  });
});
