import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ invoice_number: string }>;
}) {
  const { invoice_number } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("invoice_number,status,total_cents,created_at,customer_snapshot")
    .eq("invoice_number", invoice_number)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!invoice) {
    notFound();
  }

  const snap = (invoice.customer_snapshot ?? {}) as Record<string, unknown>;
  const name = typeof snap.name === "string" ? snap.name : undefined;
  const address = typeof snap.address === "string" ? snap.address : undefined;
  const createdAt = invoice.created_at
    ? new Date(invoice.created_at as string).toLocaleString("en-ZA")
    : "";

  const totalRands = ((invoice.total_cents ?? 0) / 100).toFixed(2);

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Invoice {invoice.invoice_number}</h1>
      <div className="mt-2 text-sm text-zinc-600">
        Status: <span className="font-medium">{invoice.status}</span>
      </div>
      {createdAt ? (
        <div className="mt-1 text-xs text-zinc-500">Created: {createdAt}</div>
      ) : null}

      <section className="mt-6 rounded-xl border bg-white p-4 text-sm">
        <div className="font-semibold">Bill to</div>
        {name ? <div className="mt-1 text-zinc-900">{name}</div> : null}
        {address ? (
          <div className="mt-1 whitespace-pre-wrap text-zinc-700">{address}</div>
        ) : (
          <div className="mt-1 text-zinc-500">Customer details not available.</div>
        )}
      </section>

      <section className="mt-6 rounded-xl border bg-white p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-600">Invoice total</span>
          <span className="text-lg font-semibold text-zinc-900">R{totalRands}</span>
        </div>
      </section>

      <div className="mt-6 text-xs text-zinc-500">
        This link is for your records. If you have any questions about this invoice, please contact the store.
      </div>
    </main>
  );
}
