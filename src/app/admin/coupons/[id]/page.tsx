import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/CouponForm";
import { DeleteCouponButton } from "@/components/admin/DeleteCouponButton";

export const revalidate = 0;

export default async function AdminEditCouponPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!coupon) {
    return (
      <AdminShell title="Coupon not found">
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Coupons
        </Link>

        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          No coupon was found with ID <code className="font-mono text-xs">{params.id}</code>.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Edit Coupon">
      <Link
        href="/admin/coupons"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Coupons
      </Link>

      <CouponForm mode="edit" couponId={params.id} initial={coupon} />
      <DeleteCouponButton id={params.id} />
    </AdminShell>
  );
}
