import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/CouponForm";

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
    notFound();
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
    </AdminShell>
  );
}
