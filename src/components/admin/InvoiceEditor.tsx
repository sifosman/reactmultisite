"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getInvoiceStatusBadges } from "./invoiceStatusDisplay";
import { calculateInvoiceTotals, formatZar } from "@/lib/invoice/calculateInvoiceTotals";

type CatalogItem =
  | {
      kind: "variant";
      product_id: string;
      variant_id: string;
      title: string;
      variant_name: string | null;
      sku: string;
      stock_qty: number;
      unit_price_cents_default: number;
      variant_snapshot: Record<string, unknown>;
    }
  | {
      kind: "simple";
      product_id: string;
      variant_id: null;
      title: string;
      variant_name: null;
      sku: string | null;
      stock_qty: number;
      unit_price_cents_default: number;
      variant_snapshot: Record<string, unknown>;
    };

type InvoiceLine = {
  id: string;
  product_id: string;
  variant_id: string | null;
  qty: number;
  unit_price_cents: number;
  title_snapshot: string;
  variant_snapshot: Record<string, unknown>;
  line_total_cents: number;
  stock_qty?: number; // Available stock for validation
  _temp_price_input?: string; // Temporary storage for price input
};

type InvoiceDetail = {
  id: string;
  invoice_number: string;
  status: "draft" | "issued" | "cancelled";
  customer_id: string | null;
  customer_snapshot: Record<string, unknown>;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  delivery_cents?: number;
  created_at: string;
  issued_at: string | null;
  cancelled_at: string | null;
  payment_status?: "unpaid" | "paid" | null;
  payment_status_updated_at?: string | null;
  fulfilment_status?: "pending" | "dispatched" | null;
  fulfilment_status_updated_at?: string | null;
  lines: InvoiceLine[];
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

function centsToRandsString(cents: number) {
  return (cents / 100).toFixed(2);
}

function randsStringToCents(input: string) {
  const n = Number(String(input).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

export function InvoiceEditor({
  mode,
  invoiceId,
}: {
  mode: "create" | "edit";
  invoiceId?: string;
}) {
  const router = useRouter();

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [createdDraftId, setCreatedDraftId] = useState<string | null>(null);
  const didAutoCreateDraftRef = useRef(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const [deliveryFeeRands, setDeliveryFeeRands] = useState(formatZar(invoice?.delivery_cents ?? 0).replace('R', ''));

  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const status = invoice?.status ?? "draft";
  const paymentStatus = (invoice?.payment_status as "unpaid" | "paid" | null | undefined) ?? "unpaid";
  const fulfilmentStatus = (invoice?.fulfilment_status as "pending" | "dispatched" | null | undefined) ?? "pending";

  useEffect(() => {
    if (mode !== "create") return;
    if (creatingDraft) return;
    if (invoice) return;
    if (createdDraftId) return;
    if (didAutoCreateDraftRef.current) return;

    const controller = new AbortController();

    async function createDraft() {
      setError(null);
      setCreatingDraft(true);
      didAutoCreateDraftRef.current = true;

      try {
        const res = await fetch("/api/admin/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            customer_id: null,
            customer_snapshot: {},
          }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          setError(json?.error ?? "Failed to create invoice");
          return;
        }

        const id = json?.id as string | undefined;
        if (!id) {
          setError("Failed to create invoice");
          return;
        }

        setCreatedDraftId(id);
        router.replace(`/admin/invoices/${id}`);
        router.refresh();
      } finally {
        if (mountedRef.current) setCreatingDraft(false);
      }
    }

    void createDraft();
    return () => {
      controller.abort();
    };
  }, [mode, creatingDraft, invoice, createdDraftId, router]);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      const res = await fetch("/api/admin/invoice-customers?limit=50", { method: "GET" });
      const json = await res.json().catch(() => null);
      if (cancelled) return;
      if (res.ok) {
        setCustomers((json?.customers ?? []) as Customer[]);
      }
    }

    void loadCustomers();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !invoiceId) return;

    let cancelled = false;

    async function load() {
      setError(null);
      setLoading(true);

      const res = await fetch(`/api/admin/invoices/${invoiceId}`, { method: "GET" });
      const json = await res.json().catch(() => null);
      if (cancelled) return;

      setLoading(false);

      if (!res.ok) {
        setError(json?.error ?? "Failed to load invoice");
        return;
      }

      const inv = json?.invoice as InvoiceDetail;
      setInvoice(inv);

      const snap = (inv.customer_snapshot ?? {}) as Record<string, unknown>;
      setCustomerName(typeof snap.name === "string" ? snap.name : "");
      setCustomerPhone(typeof snap.phone === "string" ? snap.phone : "");
      setCustomerEmail(typeof snap.email === "string" ? snap.email : "");
      setCustomerAddress(typeof snap.address === "string" ? snap.address : "");

      setDeliveryFeeRands(centsToRandsString(inv.delivery_cents ?? 0));

      setSelectedCustomerId(inv.customer_id ?? "");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mode, invoiceId]);

  useEffect(() => {
    if (!invoice) return;
    setDeliveryFeeRands(formatZar(invoice.delivery_cents ?? 0).replace('R', ''));
  }, [invoice?.delivery_cents]);

  useEffect(() => {
    const q = catalogQuery.trim();
    if (!q) {
      setCatalog([]);
      return;
    }

    let cancelled = false;

    async function search() {
      setCatalogLoading(true);
      const res = await fetch(`/api/admin/invoice-catalog?q=${encodeURIComponent(q)}`, { method: "GET" });
      const json = await res.json().catch(() => null);
      if (cancelled) return;
      setCatalogLoading(false);
      if (!res.ok) {
        setCatalog([]);
        return;
      }
      setCatalog((json?.items ?? []) as CatalogItem[]);
    }

    const t = window.setTimeout(() => void search(), 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [catalogQuery]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = `${c.name} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [customers, customerSearch]);

  const totals = useMemo(() => {
    if (!invoice?.lines) {
      return { subtotal: 0, discount: 0, delivery: 0, total: 0 };
    }
    
    const calculatedTotals = calculateInvoiceTotals(
      invoice.lines,
      invoice.delivery_cents,
      invoice.discount_cents
    );
    
    return {
      subtotal: calculatedTotals.subtotal_cents,
      discount: calculatedTotals.discount_cents,
      delivery: calculatedTotals.delivery_cents,
      total: calculatedTotals.total_cents
    };
  }, [invoice]);

  function shareInvoiceOnWhatsApp() {
    if (typeof window === "undefined") return;
    if (!invoice?.id) return;

    const number = invoice.invoice_number;
    const total = formatZar(totals.total);
    const url = `${window.location.origin}/invoice/${encodeURIComponent(number)}`;

    const parts: string[] = [];
    if (customerName.trim()) {
      parts.push(customerName.trim());
    }
    parts.push(`Invoice ${number}`);
    parts.push(`Total: R${total}`);
    parts.push(url);

    const text = parts.join(" • ");
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  }

  async function createInvoice() {
    setError(null);
    setSaving(true);

    const customer_snapshot = {
      name: customerName || undefined,
      phone: customerPhone || undefined,
      email: customerEmail || undefined,
      address: customerAddress || undefined,
    };

    const res = await fetch("/api/admin/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: selectedCustomerId || null,
        customer_snapshot,
      }),
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to create invoice");
      return;
    }

    const id = json?.id as string | undefined;
    if (!id) {
      setError("Failed to create invoice");
      return;
    }

    router.replace(`/admin/invoices/${id}`);
    router.refresh();
  }

  async function addLine(item: CatalogItem) {
    if (!invoice?.id) return;
    if (status === "cancelled") return;

    // Check stock availability before adding
    if (item.stock_qty <= 0) {
      setError(`Item "${item.title}" is out of stock`);
      return;
    }

    setError(null);
    setSaving(true);

    const res = await fetch(`/api/admin/invoices/${invoice.id}/lines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: item.product_id,
        variant_id: item.kind === "variant" ? item.variant_id : null,
        qty: 1, // Always start with 1, stock validation handled server-side
        unit_price_cents: item.unit_price_cents_default,
        title_snapshot: item.title,
        variant_snapshot: item.variant_snapshot,
      }),
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      if (json?.error === "out_of_stock") {
        setError(`Only ${item.stock_qty} item(s) available in stock`);
      } else {
        setError(json?.error ?? "Failed to add line");
      }
      return;
    }

    setInvoice(json?.invoice as InvoiceDetail);
    setCatalogQuery("");
    setCatalog([]);
  }

  async function updateLine(lineId: string, patch: Partial<Pick<InvoiceLine, "qty" | "unit_price_cents">>) {
    if (!invoice?.id) return;
    if (status === "cancelled") return;

    // Optimistic update for immediate UI response
    if (patch.unit_price_cents !== undefined || patch.qty !== undefined) {
      setInvoice((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lines: prev.lines.map((x) => {
            if (x.id === lineId) {
              const updatedLine = { ...x };
              if (patch.unit_price_cents !== undefined) {
                updatedLine.unit_price_cents = patch.unit_price_cents;
                updatedLine.line_total_cents = patch.unit_price_cents * (x.qty || 1);
              }
              if (patch.qty !== undefined) {
                updatedLine.qty = patch.qty;
                updatedLine.line_total_cents = patch.qty * (x.unit_price_cents || 0);
              }
              return updatedLine;
            }
            return x;
          }),
        };
      });
    }

    setError(null);
    setSaving(true);

    const res = await fetch(`/api/admin/invoices/${invoice.id}/lines/${lineId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to update line");
      return;
    }

    setInvoice(json?.invoice as InvoiceDetail);
    router.refresh();
  }

  async function updateDeliveryFee() {
    if (!invoice?.id) return;
    if (status === "cancelled") return;

    setError(null);
    setSaving(true);

    const nextCents = randsStringToCents(deliveryFeeRands);
    const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delivery_cents: nextCents }),
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to update delivery fee");
      return;
    }

    setInvoice(json?.invoice as InvoiceDetail);
    router.refresh();
  }

  async function markPaid() {
    if (!invoice?.id) return;
    setError(null);
    setSaving(true);

    const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status: "paid" }),
    });
    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to update payment status");
      return;
    }

    setInvoice(json?.invoice as InvoiceDetail);
    router.refresh();
  }

  async function markDispatched() {
    if (!invoice?.id) return;
    setError(null);
    setSaving(true);

    const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fulfilment_status: "dispatched" }),
    });
    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to update fulfilment status");
      return;
    }

    setInvoice(json?.invoice as InvoiceDetail);
    router.refresh();
  }

  async function removeLine(lineId: string) {
    if (!invoice?.id) return;
    if (status === "cancelled") return;

    console.log("Removing line:", { lineId, invoiceId: invoice.id, status, saving });
    setError(null);
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/invoices/${invoice.id}/lines/${lineId}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      setSaving(false);

      console.log("Remove line response:", { status: res.status, ok: res.ok, json });

      if (!res.ok) {
        const errorMsg = json?.error ?? "Failed to remove line";
        console.error("Remove line failed:", errorMsg);
        setError(errorMsg);
        return;
      }

      console.log("Line removed successfully, updating invoice state");
      setInvoice(json?.invoice as InvoiceDetail);
    } catch (error) {
      console.error("Remove line error:", error);
      setError("Failed to remove line");
      setSaving(false);
    }
  }

  async function saveCustomerSnapshot() {
    if (!invoice?.id) return;
    if (status === "cancelled") return;

    setError(null);
    setSaving(true);

    const customer_snapshot = {
      name: customerName || undefined,
      phone: customerPhone || undefined,
      email: customerEmail || undefined,
      address: customerAddress || undefined,
    };

    const res = await fetch(`/api/admin/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: selectedCustomerId || null,
        customer_snapshot,
      }),
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to save invoice");
      return;
    }

    setInvoice(json?.invoice as InvoiceDetail);
  }

  async function issueInvoice() {
    if (!invoice?.id) return;
    setError(null);
    setSaving(true);

    const res = await fetch(`/api/admin/invoices/${invoice.id}/issue`, { method: "POST" });
    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to issue invoice");
      return;
    }

    setInvoice(json?.invoice as InvoiceDetail);
    router.refresh();
  }

  async function cancelInvoice() {
    if (!invoice?.id) return;
    setError(null);
    setSaving(true);

    const res = await fetch(`/api/admin/invoices/${invoice.id}/cancel`, { method: "POST" });
    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to cancel invoice");
      return;
    }

    setInvoice(json?.invoice as InvoiceDetail);
    router.refresh();
  }

  async function createAndAddCustomer() {
    setError(null);
    setSaving(true);

    const res = await fetch("/api/admin/invoice-customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: customerName,
        phone: customerPhone || null,
        email: customerEmail || null,
        address: customerAddress || null,
      }),
    });

    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(json?.error ?? "Failed to create customer");
      return;
    }

    const created = json?.customer as Customer | undefined;
    if (created?.id) {
      setCustomers((prev) => [created, ...prev]);
      setSelectedCustomerId(created.id);
    }
  }

  if (loading || creatingDraft) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-zinc-600">
        {createdDraftId ? "Redirecting…" : "Loading…"}
      </div>
    );
  }

  if (mode === "create" && createdDraftId) {
    return (
      <div className="rounded-xl border bg-white p-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="text-sm text-zinc-600">Draft invoice created.</div>
        <div className="mt-2 font-mono text-sm">{createdDraftId}</div>
        <div className="mt-4">
          <a
            className="inline-flex h-10 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white"
            href={`/admin/invoices/${createdDraftId}`}
          >
            Open invoice
          </a>
        </div>
      </div>
    );
  }

  if (mode === "edit" && !invoice) {
    return (
      <div className="rounded-xl border bg-white p-6 text-sm text-red-700">
        {error ?? "Invoice not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-xl border bg-white p-4 text-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-slate-600">Invoice</div>
            <div className="mt-1 font-mono text-sm text-slate-900">
              {invoice?.invoice_number ?? "(new)"}
            </div>
            <div className="mt-1 flex flex-wrap gap-1 text-xs">
              {getInvoiceStatusBadges({
                status,
                payment_status: paymentStatus,
                fulfilment_status: fulfilmentStatus,
              }).map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {mode === "create" ? (
              <button
                type="button"
                className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white disabled:opacity-60"
                disabled={saving}
                onClick={() => void createInvoice()}
              >
                {saving ? "Creating…" : "Create invoice"}
              </button>
            ) : (
              <>
                <a
                  className="h-10 rounded-lg border bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  href={`/api/admin/invoices/${invoice?.id}/pdf`}
                >
                  Download PDF
                </a>

                <button
                  type="button"
                  className="h-10 rounded-lg border bg-white px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                  disabled={!invoice}
                  onClick={shareInvoiceOnWhatsApp}
                >
                  Share on WhatsApp
                </button>

                <button
                  type="button"
                  className="h-10 rounded-lg border bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={saving || status === "cancelled"}
                  onClick={() => void saveCustomerSnapshot()}
                >
                  {saving ? "Saving…" : "Save"}
                </button>

                <button
                  type="button"
                  className="h-10 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white disabled:opacity-60"
                  disabled={saving || status !== "draft" || (invoice?.lines?.length ?? 0) === 0}
                  onClick={() => void issueInvoice()}
                >
                  {saving ? "Issuing…" : "Issue (deduct stock)"}
                </button>

                <button
                  type="button"
                  className="h-10 rounded-lg bg-red-600 px-4 text-sm font-medium text-white disabled:opacity-60"
                  disabled={saving || status !== "issued"}
                  onClick={() => void cancelInvoice()}
                >
                  {saving ? "Cancelling…" : "Cancel (restore stock)"}
                </button>

                <button
                  type="button"
                  className="h-10 rounded-lg border bg-white px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                  disabled={saving || status !== "issued" || paymentStatus === "paid"}
                  onClick={() => void markPaid()}
                >
                  {saving ? "Saving…" : paymentStatus === "paid" ? "Marked as paid" : "Mark as paid"}
                </button>

                <button
                  type="button"
                  className="h-10 rounded-lg border bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  disabled={saving || status !== "issued" || fulfilmentStatus === "dispatched"}
                  onClick={() => void markDispatched()}
                >
                  {saving
                    ? "Saving…"
                    : fulfilmentStatus === "dispatched"
                    ? "Marked as dispatched"
                    : "Mark as dispatched"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 text-slate-900">
        <div className="text-sm font-semibold text-slate-900">Client details</div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Client name</label>
            <input
              className="h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              disabled={saving || status === "cancelled"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input
              className="h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="082 123 4567"
              disabled={saving || status === "cancelled"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email (optional)</label>
            <input
              className="h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@email.com"
              disabled={saving || status === "cancelled"}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700">Address (optional)</label>
            <textarea
              className="min-h-20 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Delivery address"
              disabled={saving || status === "cancelled"}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="text-sm font-medium text-slate-700">Pick existing client (optional)</div>
            <input
              className="mt-1 h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search clients…"
              disabled={saving || status === "cancelled"}
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {filteredCustomers.slice(0, 10).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={
                    "rounded-full border px-3 py-1 text-xs " +
                    (selectedCustomerId === c.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-700")
                  }
                  disabled={saving || status === "cancelled"}
                  onClick={() => {
                    setSelectedCustomerId(c.id);
                    setCustomerName(c.name);
                    setCustomerPhone(c.phone ?? "");
                    setCustomerEmail(c.email ?? "");
                    setCustomerAddress(c.address ?? "");
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <button
                type="button"
                className="h-10 rounded-lg border bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={saving || !customerName.trim() || status === "cancelled"}
                onClick={() => void createAndAddCustomer()}
              >
                Save as reusable client
              </button>
            </div>
          </div>
        </div>
      </div>

      {mode === "edit" ? (
        <div className="rounded-xl border bg-white p-4 text-slate-900">
          <div className="text-sm font-semibold text-slate-900">Add items</div>
          <div className="mt-3">
            <input
              className="h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
              value={catalogQuery}
              onChange={(e) => setCatalogQuery(e.target.value)}
              placeholder="Search products / SKU…"
              disabled={saving || status === "cancelled"}
            />
          </div>

          {catalogLoading ? <div className="mt-3 text-sm text-zinc-600">Searching…</div> : null}

          {(catalog ?? []).length > 0 ? (
            <div className="mt-3 space-y-2">
              {catalog.slice(0, 12).map((item) => {
                const isOutOfStock = item.stock_qty <= 0;
                const stockColor = item.stock_qty <= 2 ? "text-red-600" : item.stock_qty <= 5 ? "text-yellow-600" : "text-green-600";
                const stockText = isOutOfStock ? "Out of stock" : `${item.stock_qty} available`;
                
                return (
                <button
                  key={`${item.kind}-${item.product_id}-${item.kind === "variant" ? item.variant_id : "simple"}`}
                  type="button"
                  className={`w-full rounded-lg border p-3 text-left hover:bg-slate-50 disabled:opacity-60 ${
                    isOutOfStock ? "border-red-200 bg-red-50 opacity-60" : "border-slate-200"
                  }`}
                  disabled={saving || status === "cancelled" || isOutOfStock}
                  onClick={() => void addLine(item)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {item.title}
                        {item.variant_name ? ` (${item.variant_name})` : ""}
                      </div>
                      <div className="mt-1 text-xs">
                        <span className={`${stockColor} font-medium`}>
                          {stockText}
                        </span>
                        <span className="text-slate-500"> • Default: {formatZar(item.unit_price_cents_default)}</span>
                      </div>
                    </div>
                    <div className={`text-xs font-medium ${
                      isOutOfStock ? "text-red-600" : "text-slate-500"
                    }`}>
                      {isOutOfStock ? "Unavailable" : "Add"}
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "edit" ? (
        <div className="rounded-xl border bg-white p-4 text-slate-900">
          <div className="text-sm font-semibold text-slate-900">Lines</div>

          {(invoice?.lines ?? []).length === 0 ? (
            <div className="mt-3 text-sm text-zinc-600">No items yet.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {(invoice?.lines ?? []).map((l) => {
                const vName = typeof l.variant_snapshot?.name === "string" ? ` (${l.variant_snapshot.name})` : "";

                return (
                  <div key={l.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {l.title_snapshot}
                          {vName}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Line total: {formatZar(l.line_total_cents)}</div>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline disabled:opacity-60"
                        disabled={saving || status === "cancelled"}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log("Remove button clicked for line:", l.id);
                          void removeLine(l.id);
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-600">Qty</div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="h-10 w-10 rounded-md border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                            disabled={saving || status === "cancelled" || l.qty <= 1}
                            onClick={() => {
                              const newQty = Math.max(1, l.qty - 1);
                              // Optimistic update for immediate UI response
                              setInvoice((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  lines: prev.lines.map((x) => 
                                    x.id === l.id ? { ...x, qty: newQty, line_total_cents: newQty * x.unit_price_cents } : x
                                  ),
                                };
                              });
                              // Then update on server
                              void updateLine(l.id, { qty: newQty });
                            }}
                          >
                            −
                          </button>
                          <input
                            className="h-10 w-16 rounded-md border bg-white px-2 text-center text-sm text-slate-900"
                            inputMode="numeric"
                            value={String(l.qty)}
                            disabled={saving || status === "cancelled"}
                            readOnly
                            style={{ pointerEvents: 'none' }}
                          />
                          <button
                            type="button"
                            className="h-10 w-10 rounded-md border bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                            disabled={
                              saving ||
                              status === "cancelled" ||
                              (typeof l.stock_qty === "number" ? l.qty >= l.stock_qty : false)
                            }
                            onClick={() => {
                              const newQty = l.qty + 1;
                              
                              // Validate against stock if available
                              if (typeof l.stock_qty === "number" && newQty > l.stock_qty) {
                                setError(`Cannot add more than available stock: ${l.stock_qty} item(s)`);
                                setTimeout(() => setError(null), 3000);
                                return;
                              }
                              
                              // Optimistic update for immediate UI response
                              setInvoice((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  lines: prev.lines.map((x) => 
                                    x.id === l.id ? { ...x, qty: newQty, line_total_cents: newQty * x.unit_price_cents } : x
                                  ),
                                };
                              });
                              // Then update on server
                              void updateLine(l.id, { qty: newQty });
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-600">Unit price (R)</div>
                        <input
                          className="h-10 w-full rounded-md border bg-white px-3 text-sm text-slate-900"
                          inputMode="decimal"
                          value={l._temp_price_input ?? (l.unit_price_cents / 100).toFixed(2)}
                          disabled={saving || status === "cancelled"}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty value and decimal numbers
                            if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                              setInvoice((prev) => {
                                if (!prev) return prev;
                                return {
                                  ...prev,
                                  lines: prev.lines.map((x) =>
                                    x.id === l.id ? { ...x, _temp_price_input: value } : x
                                  ),
                                };
                              });
                            }
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            let cents = l.unit_price_cents; // Default to current value
                            
                            if (value !== "") {
                              // Convert rands to cents
                              const rands = parseFloat(value);
                              if (!isNaN(rands) && rands >= 0) {
                                cents = Math.round(rands * 100);
                              }
                            }
                            
                            // Update the line with the new price
                            void updateLine(l.id, { unit_price_cents: cents });
                            
                            // Clear temporary input
                            setInvoice((prev) => {
                              if (!prev) return prev;
                              return {
                                ...prev,
                                lines: prev.lines.map((x) =>
                                  x.id === l.id ? { ...x, _temp_price_input: undefined } : x
                                ),
                              };
                            });
                          }}
                          onFocus={(e) => {
                            // Select all text when focused for easy editing
                            e.target.select();
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 rounded-lg border bg-slate-50 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">R{centsToRandsString(totals.subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Delivery fee</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">R</span>
                <input
                  className="h-9 w-28 rounded-md border bg-white px-2 text-sm text-slate-900"
                  inputMode="decimal"
                  value={deliveryFeeRands}
                  disabled={saving || status === "cancelled"}
                  onChange={(e) => setDeliveryFeeRands(e.target.value)}
                  onBlur={() => void updateDeliveryFee()}
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-600">Discount</span>
              <span className="font-semibold">R{centsToRandsString(totals.discount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-900">Total</span>
              <span className="text-lg font-bold">R{centsToRandsString(totals.total)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
