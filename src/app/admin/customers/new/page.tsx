import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CustomerForm } from "@/components/admin/CustomerForm";

export default async function AdminNewCustomerPage() {
  await requireAdmin();

  return (
    <AdminShell title="New Customer">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Customers
      </Link>

      <CustomerForm mode="create" />
    </AdminShell>
  );
}
