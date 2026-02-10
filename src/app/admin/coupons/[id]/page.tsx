import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/CouponForm";
import { DeleteCouponButton } from "@/components/admin/DeleteCouponButton";
import { z } from "zod";

export const revalidate = 0;

export default async function AdminEditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return (
      <AdminShell title="Error loading coupon">
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Coupons
        </Link>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold text-gray-900">Invalid coupon id</div>
          <div className="mt-1 break-all text-xs text-gray-900">{String(id)}</div>
        </div>
      </AdminShell>
    );
  }

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", parsedId.data)
    .single();

  if (error) {
    return (
      <AdminShell title="Error loading coupon">
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Coupons
        </Link>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold text-gray-900">Database error</div>
          <div className="mt-1 break-all text-xs text-gray-900">{error.message}</div>
        </div>
      </AdminShell>
    );
  }

  if (!coupon) {
    return (
      <AdminShell title="Coupon not found">
        <Link
          href="/admin/coupons"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Coupons
        </Link>

        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          No coupon was found with ID <code className="font-mono text-xs text-gray-900">{parsedId.data}</code>.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Edit Coupon">
      <Link
        href="/admin/coupons"
        className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Coupons
      </Link>

      <CouponForm mode="edit" couponId={parsedId.data} initial={coupon} />
      <DeleteCouponButton id={parsedId.data} />
    </AdminShell>
  );
}
