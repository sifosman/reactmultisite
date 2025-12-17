import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminNewInvoicePage() {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_invoice", {
    customer_id: null,
    customer_snapshot: {},
    currency: "ZAR",
  });

  if (error) {
    return (
      <AdminShell title="New invoice">
        <div className="mb-6">
          <Link className="text-sm text-zinc-600 hover:underline" href="/admin/invoices">
            Back to invoices
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      </AdminShell>
    );
  }

  const id = (data as unknown as string | null) ?? null;
  if (!id) {
    return (
      <AdminShell title="New invoice">
        <div className="mb-6">
          <Link className="text-sm text-zinc-600 hover:underline" href="/admin/invoices">
            Back to invoices
          </Link>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to create invoice
        </div>
      </AdminShell>
    );
  }

  redirect(`/admin/invoices/${id}`);

  return (
    <AdminShell title="New invoice">
      <div className="mb-6">
        <Link className="text-sm text-zinc-600 hover:underline" href="/admin/invoices">
          Back to invoices
        </Link>
      </div>
    </AdminShell>
  );
}
