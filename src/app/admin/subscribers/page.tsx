import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminSubscribersPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("id,email,source,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <AdminShell title="Subscribers">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Source</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Subscribed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(subscribers ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{s.email}</td>
                <td className="px-6 py-4 text-sm text-slate-500">{s.source}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(s.created_at).toLocaleString("en-ZA")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(subscribers ?? []).length === 0 ? (
        <div className="mt-6 rounded-xl border bg-white p-6 text-sm text-slate-500">No subscribers yet.</div>
      ) : null}
    </AdminShell>
  );
}
