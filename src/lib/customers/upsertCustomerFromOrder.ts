import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function upsertCustomerFromOrder(order: {
  user_id: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  total_cents?: number;
  created_at?: string;
  isPaid?: boolean;
}) {
  const supabaseAdmin = createSupabaseAdminClient();

  const email = order.customer_email.trim().toLowerCase();

  const totalOrdersInc = order.isPaid ? 1 : 0;
  const totalSpentInc = order.isPaid ? order.total_cents ?? 0 : 0;

  const payload: Record<string, unknown> = {
    user_id: order.user_id,
    email,
    full_name: order.customer_name,
    phone: order.customer_phone,
    updated_at: new Date().toISOString(),
  };

  if (order.isPaid) {
    payload.last_order_at = order.created_at ?? new Date().toISOString();
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("customers")
    .select("id,total_orders,total_spent_cents")
    .eq("email", email)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    const { error } = await supabaseAdmin.from("customers").insert({
      ...payload,
      total_orders: totalOrdersInc,
      total_spent_cents: totalSpentInc,
      last_order_at: payload.last_order_at ?? null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from("customers")
    .update({
      ...payload,
      total_orders: (existing.total_orders ?? 0) + totalOrdersInc,
      total_spent_cents: (existing.total_spent_cents ?? 0) + totalSpentInc,
    })
    .eq("id", existing.id);

  if (updateError) {
    throw new Error(updateError.message);
  }
}
