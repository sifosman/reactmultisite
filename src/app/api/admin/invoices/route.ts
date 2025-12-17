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

const createSchema = z.object({
  customer_id: z.string().uuid().nullable().optional(),
  customer_snapshot: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(req: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin.rpc("create_invoice", {
    customer_id: parsed.data.customer_id ?? null,
    customer_snapshot: parsed.data.customer_snapshot ?? {},
    currency: "ZAR",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const id = (data as unknown as string | null) ?? null;
  if (!id) return NextResponse.json({ error: "invoice_create_failed" }, { status: 500 });

  return NextResponse.json({ id });
}
