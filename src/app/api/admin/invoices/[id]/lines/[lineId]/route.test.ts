import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { PATCH } from "./route";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

describe("invoice line PATCH route", () => {
  const baseInvoice = {
    id: "invoice-1",
    invoice_number: "INV-001",
    status: "issued",
    customer_id: null,
    customer_snapshot: {},
    subtotal_cents: 5000,
    discount_cents: 0,
    delivery_cents: 0,
    total_cents: 5000,
    currency: "ZAR",
    created_at: "2026-03-13T10:00:00.000Z",
    issued_at: "2026-03-13T10:05:00.000Z",
    cancelled_at: null,
  };

  const currentLine = {
    id: "line-1",
    product_id: "product-1",
    variant_id: null,
    qty: 2,
    unit_price_cents: 1000,
    title_snapshot: "Test Product",
    variant_snapshot: {},
    line_total_cents: 2000,
  };

  let inserts: Array<{ table: string; values: unknown }>;
  let lineUpdatePayload: Record<string, unknown> | null;
  let invoiceUpdatePayload: Record<string, unknown> | null;

  beforeEach(() => {
    inserts = [];
    lineUpdatePayload = null;
    invoiceUpdatePayload = null;

    (createSupabaseServerClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: async () => ({ data: { user: { id: "admin-user" } } }),
      },
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: table === "profiles" ? { role: "admin" } : null, error: null }),
            }),
            maybeSingle: async () => ({ data: table === "profiles" ? { role: "admin" } : null, error: null }),
          }),
        }),
      }),
    });

    (createSupabaseAdminClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      from(table: string) {
        const state: {
          table: string;
          action: "select" | "update" | "insert" | null;
          selectQuery: string | null;
          updateData: Record<string, unknown> | null;
          insertData: unknown;
          filters: Record<string, unknown>;
        } = {
          table,
          action: null,
          selectQuery: null,
          updateData: null,
          insertData: null,
          filters: {},
        };

        const resolveSingle = async () => {
          if (state.table === "invoices") {
            return { data: { ...baseInvoice }, error: null };
          }

          if (state.table === "invoice_lines") {
            return {
              data:
                state.filters.id === currentLine.id
                  ? {
                      id: currentLine.id,
                      qty: currentLine.qty,
                      unit_price_cents: currentLine.unit_price_cents,
                      product_id: currentLine.product_id,
                      variant_id: currentLine.variant_id,
                    }
                  : null,
              error: null,
            };
          }

          if (state.table === "products") {
            return { data: { stock_qty: 3 }, error: null };
          }

          return { data: null, error: null };
        };

        const resolveMany = async () => {
          if (state.table === "invoice_lines") {
            if (state.selectQuery === "qty,unit_price_cents") {
              return {
                data: [
                  {
                    qty: currentLine.qty,
                    unit_price_cents: Number(lineUpdatePayload?.unit_price_cents ?? currentLine.unit_price_cents),
                  },
                ],
                error: null,
              };
            }

            return {
              data: [
                {
                  ...currentLine,
                  unit_price_cents: Number(lineUpdatePayload?.unit_price_cents ?? currentLine.unit_price_cents),
                  line_total_cents: Number(lineUpdatePayload?.line_total_cents ?? currentLine.line_total_cents),
                },
              ],
              error: null,
            };
          }

          return { data: [], error: null };
        };

        const resolveDirect = async () => {
          if (state.action === "update") {
            if (state.table === "invoice_lines") {
              lineUpdatePayload = state.updateData;
            }

            if (state.table === "invoices") {
              invoiceUpdatePayload = state.updateData;
            }

            return { error: null };
          }

          if (state.action === "insert") {
            inserts.push({ table: state.table, values: state.insertData });
            return { error: null };
          }

          return resolveMany();
        };

        const builder = {
          select(query: string) {
            state.action = "select";
            state.selectQuery = query;
            return builder;
          },
          update(data: Record<string, unknown>) {
            state.action = "update";
            state.updateData = data;
            return builder;
          },
          insert(data: unknown) {
            state.action = "insert";
            state.insertData = data;
            return builder;
          },
          eq(field: string, value: unknown) {
            state.filters[field] = value;
            return builder;
          },
          maybeSingle() {
            return resolveSingle();
          },
          order() {
            return resolveMany();
          },
          then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
            return resolveDirect().then(resolve, reject);
          },
        };

        return builder;
      },
    });
  });

  it("allows price-only updates without triggering out_of_stock", async () => {
    const req = new Request("http://localhost/api/admin/invoices/invoice-1/lines/line-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unit_price_cents: 2500 }),
    });

    const response = await PATCH(req, {
      params: Promise.resolve({ id: "invoice-1", lineId: "line-1" }),
    });

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(lineUpdatePayload).toEqual({
      qty: 2,
      unit_price_cents: 2500,
      line_total_cents: 5000,
    });
    expect(invoiceUpdatePayload).toEqual({
      subtotal_cents: 5000,
      total_cents: 5000,
    });
    expect(inserts).toHaveLength(0);
    expect(json.invoice.lines[0].unit_price_cents).toBe(2500);
    expect(json.invoice.lines[0].line_total_cents).toBe(5000);
  });
});
