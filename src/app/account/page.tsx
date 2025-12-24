import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountDetailsForm } from "@/components/account/AccountDetailsForm";
import { LogoutButton } from "@/components/account/LogoutButton";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const email = (user.email ?? "").trim().toLowerCase();

  // Load customer record (if any)
  const { data: customer } = await supabase
    .from("customers")
    .select("full_name,phone")
    .or(`user_id.eq.${user.id},email.eq.${email}`)
    .maybeSingle();

  // Load this user's orders (policies ensure only own orders are visible)
  const { data: orders } = await supabase
    .from("orders")
    .select("id,status,total_cents,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">My account</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Signed in as <span className="font-medium">{user.email}</span>
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Account details */}
        <section className="rounded-xl border bg-white p-4 lg:col-span-1">
          <h2 className="text-sm font-semibold text-zinc-900">Account details</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Update your contact details used for orders.
          </p>

          <div className="mt-4">
            <AccountDetailsForm
              initialFullName={(customer as any)?.full_name ?? ""}
              initialPhone={(customer as any)?.phone ?? ""}
              email={user.email ?? ""}
            />
          </div>
        </section>

        {/* Order history */}
        <section className="rounded-xl border bg-white p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Order history</h2>
              <p className="mt-1 text-xs text-zinc-600">
                View your recent orders and their status.
              </p>
            </div>
            <Link
              href="/products"
              className="hidden rounded-md border bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 sm:inline-flex"
            >
              Continue shopping
            </Link>
          </div>

          {(orders ?? []).length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
              You don't have any orders yet.
            </div>
          ) : (
            <div className="mt-4 w-full overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <th className="px-3 py-2 text-left">Order</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {(orders ?? []).map((o) => (
                    <tr key={o.id} className="group cursor-pointer hover:bg-zinc-50">
                      <td className="px-3 py-2 align-middle">
                        <Link href={`/account/orders/${o.id}`} className="block">
                          <div className="font-mono text-xs font-semibold text-zinc-900 group-hover:text-blue-600">
                            #{String(o.id).slice(0, 8)}
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-zinc-600">
                        <Link href={`/account/orders/${o.id}`} className="block">
                          {new Date(o.created_at as string).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-zinc-700">
                        <Link href={`/account/orders/${o.id}`} className="block">
                          {String(o.status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-middle text-right text-sm font-semibold text-zinc-900">
                        <Link href={`/account/orders/${o.id}`} className="block">
                          R{(((o as any).total_cents ?? 0) / 100).toFixed(2)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
