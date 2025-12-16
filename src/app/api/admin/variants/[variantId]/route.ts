import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return { ok: false as const };

  return { ok: true as const };
}

const schema = z.object({
  sku: z.string().min(1),
  name: z.string().optional().nullable(),
  price_cents_override: z.number().int().min(0).nullable().optional(),
  stock_qty: z.number().int().min(0),
  active: z.boolean(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { variantId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("product_variants")
    .update({
      sku: parsed.data.sku,
      name: parsed.data.name ?? null,
      price_cents_override: parsed.data.price_cents_override ?? null,
      stock_qty: parsed.data.stock_qty,
      active: parsed.data.active,
    })
    .eq("id", variantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
