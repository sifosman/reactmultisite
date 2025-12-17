import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { InvoiceEditor } from "@/components/admin/InvoiceEditor";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!invoice) notFound();

  return (
    <AdminShell title="Invoice">
      <div className="mb-6">
        <Link className="text-sm text-zinc-600 hover:underline" href="/admin/invoices">
          Back to invoices
        </Link>
      </div>
      <InvoiceEditor mode="edit" invoiceId={id} />
    </AdminShell>
  );
}
