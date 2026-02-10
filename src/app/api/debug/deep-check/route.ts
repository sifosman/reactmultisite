import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Can we access cookies?
  try {
    const cookieStore = await cookies();
    results.cookies = "OK";
  } catch (e) {
    results.cookies = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Test 2: Can we create a Supabase client?
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    });
    results.supabaseClient = "OK";

    // Test 3: Can we query products?
    const { data, error, count } = await supabase
      .from("products")
      .select("id,title", { count: "exact" })
      .limit(1);

    if (error) {
      results.productsQuery = `FAIL: ${error.message}`;
    } else {
      results.productsQuery = `OK - ${count} products found`;
      results.sampleProduct = data?.[0] ?? null;
    }
  } catch (e) {
    results.supabaseClient = `FAIL: ${e instanceof Error ? e.stack : String(e)}`;
  }

  // Test 4: Check what modules are available
  try {
    const { createPublicSupabaseServerClient } = await import("@/lib/storefront/publicClient");
    const client = await createPublicSupabaseServerClient();
    const { data, error } = await client.from("products").select("id").limit(1);
    results.publicClient = error ? `FAIL: ${error.message}` : "OK";
  } catch (e) {
    results.publicClient = `FAIL: ${e instanceof Error ? e.stack : String(e)}`;
  }

  return NextResponse.json(results);
}
