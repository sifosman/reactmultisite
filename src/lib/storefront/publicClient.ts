import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createPublicSupabaseServerClient() {
  return await createSupabaseServerClient();
}
