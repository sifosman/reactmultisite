import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/CouponForm";

export default async function AdminNewCouponPage() {
  await requireAdmin();

  return (
    <AdminShell title="Create Coupon">
      <Link
        href="/admin/coupons"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Coupons
      </Link>

      <CouponForm mode="create" />
    </AdminShell>
  );
}
