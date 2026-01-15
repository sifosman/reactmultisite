import { describe, it, expect } from "vitest";
import { getInvoiceCustomerDisplay } from "./customerDisplay";

describe("getInvoiceCustomerDisplay", () => {
  it("falls back to Guest / walk-in when snapshot is null or empty", () => {
    expect(getInvoiceCustomerDisplay(null)).toEqual({ primary: "Guest / walk-in", secondary: null });
    expect(getInvoiceCustomerDisplay({})).toEqual({ primary: "Guest / walk-in", secondary: null });
  });

  it("prefers name as primary with phone or email as secondary", () => {
    expect(
      getInvoiceCustomerDisplay({ name: "John Doe", email: "john@example.com", phone: "0123456789" })
    ).toEqual({ primary: "John Doe", secondary: "0123456789" });
  });

  it("uses email when name is missing", () => {
    expect(getInvoiceCustomerDisplay({ email: "john@example.com" })).toEqual({
      primary: "john@example.com",
      secondary: null,
    });
  });

  it("uses phone when only phone is present", () => {
    expect(getInvoiceCustomerDisplay({ phone: "0123456789" })).toEqual({
      primary: "0123456789",
      secondary: null,
    });
  });
});
