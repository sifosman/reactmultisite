import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <div className="mt-6 rounded-lg border bg-white p-4">
        <div className="text-sm text-zinc-600">Signed in as</div>
        <div className="mt-1 font-medium">{user.email}</div>
      </div>
    </main>
  );
}
