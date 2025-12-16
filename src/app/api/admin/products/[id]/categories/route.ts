import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  categoryIds: z.array(z.string().uuid()).default([]),
});

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id: productId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { error: deleteError } = await supabaseAdmin
    .from("product_categories")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const categoryIds = Array.from(new Set(parsed.data.categoryIds));

  if (categoryIds.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("product_categories")
      .insert(categoryIds.map((categoryId) => ({ product_id: productId, category_id: categoryId })));

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
