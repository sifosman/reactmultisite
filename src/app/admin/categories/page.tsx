import Link from "next/link";
import { Plus, Search, Edit, Trash2, Eye, FolderOpen, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id,name,slug,image_url,created_at,sort_index")
    .order("sort_index", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <AdminShell title="Categories">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Organize your products into categories ({(categories ?? []).length} categories)
        </p>
        <Link 
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mt-6 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 sm:max-w-sm">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search categories..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      {/* Categories Grid */}
      {(categories ?? []).length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((c) => (
            <div key={c.id} className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="aspect-video w-full overflow-hidden bg-slate-100">
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={c.image_url} 
                    alt={c.name} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FolderOpen className="h-12 w-12 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{c.slug}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/category/${c.slug}`}
                    target="_blank"
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Link>
                  <Link
                    href={`/admin/categories/${c.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <FolderOpen className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No categories yet</h3>
          <p className="mt-1 text-sm text-slate-500">Get started by creating your first category</p>
          <Link
            href="/admin/categories/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
