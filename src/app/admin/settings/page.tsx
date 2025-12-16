import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export const revalidate = 0;

export default async function AdminSettingsPage() {
  await requireAdmin();

  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const hasYoco = Boolean(process.env.YOCO_SECRET_KEY && process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY);
  const hasYocoWebhook = Boolean(process.env.YOCO_WEBHOOK_SECRET);
  const hasPayFast = Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY);

  return (
    <AdminShell title="Settings">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Integrations</div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Supabase</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${hasSupabase ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {hasSupabase ? "Configured" : "Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Yoco</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${hasYoco ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {hasYoco ? "Configured" : "Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Yoco Webhook</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${hasYocoWebhook ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {hasYocoWebhook ? "Configured" : "Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">PayFast</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${hasPayFast ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {hasPayFast ? "Configured" : "Missing"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Store configuration</div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>Use the Setup Wizard to generate your `.env.local`.</div>
            <div className="mt-3">
              <a
                className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                href="/setup"
              >
                Open Setup Wizard
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
