import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendOrderPaidEmail } from "@/lib/brevo/sendOrderPaidEmail";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { ok: false as const };
  }

  return { ok: true as const };
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id,status,customer_email")
    .eq("id", id)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  }

  try {
    await sendOrderPaidEmail(id);
    return NextResponse.json({ ok: true, sentTo: order.customer_email });
  } catch (emailError) {
    const message =
      emailError instanceof Error ? emailError.message : "Unknown email error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
