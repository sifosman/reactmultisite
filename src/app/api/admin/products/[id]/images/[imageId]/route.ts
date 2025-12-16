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

function storagePathFromPublicUrl(publicUrl: string) {
  try {
    const u = new URL(publicUrl);
    const marker = "/storage/v1/object/public/product-images/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = await assertAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id: productId, imageId } = await params;

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: img, error: imgError } = await supabaseAdmin
    .from("product_images")
    .select("id,url")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  if (imgError) {
    return NextResponse.json({ error: imgError.message }, { status: 500 });
  }

  if (!img) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const storagePath = storagePathFromPublicUrl(img.url);
  if (storagePath) {
    await supabaseAdmin.storage.from("product-images").remove([storagePath]);
  }

  const { error: delError } = await supabaseAdmin.from("product_images").delete().eq("id", imageId);
  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
