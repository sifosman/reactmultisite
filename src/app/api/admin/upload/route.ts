import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export async function POST(req: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed." 
      }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 5MB." 
      }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${extension}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const safeName = file.name.replaceAll(/[^a-zA-Z0-9._-]+/g, "-");
    const storagePath = `${folder}/${timestamp}-${randomString}-${safeName}`;

    const supabaseAdmin = createSupabaseAdminClient();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("banners")
      .upload(storagePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data } = supabaseAdmin.storage.from("banners").getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      filename,
      url: data.publicUrl,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Upload failed" 
    }, { status: 500 });
  }
}
