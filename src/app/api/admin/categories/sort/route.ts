import { NextResponse } from "next/server";
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

type SortPayload = {
  items: Array<{ id: string; sort_index: number }>;
};

export async function POST(req: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as SortPayload | null;
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const updates = body.items.filter(
    (item) => typeof item.id === "string" && Number.isFinite(item.sort_index)
  );

  if (updates.length === 0) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const results = await Promise.all(
    updates.map((item) =>
      supabaseAdmin.from("categories").update({ sort_index: item.sort_index }).eq("id", item.id)
    )
  );

  const error = results.find((result) => result.error)?.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
