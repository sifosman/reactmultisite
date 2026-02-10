import Link from "next/link";
import { Plus, Edit, Eye, Package } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { DeleteAllProductsButton } from "@/components/admin/DeleteAllProductsButton";
import { ProductsFilters } from "@/components/admin/ProductsFilters";

export const revalidate = 0;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" ? sp.status : "all";
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";

  const baseSelect = "id,name,slug,price_cents,stock_qty,active,has_variants,created_at,product_images(url)";
  let query = supabase.from("products").select(baseSelect);

  if (q) {
    const safe = q.replace(/%/g, "\\%");
    query = query.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%`);
  }

  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);

  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "stock_asc":
      query = query.order("stock_qty", { ascending: true });
      break;
    case "stock_desc":
      query = query.order("stock_qty", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data: products, error } = await query.limit(200);

  return (
    <AdminShell title="Products">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Manage your product catalog ({(products ?? []).length} products)
        </p>
        <div className="flex items-center gap-3">
          <DeleteAllProductsButton />
          <Link
            href="/admin/products/bulk"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" />
            Bulk upload
          </Link>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      <ProductsFilters
        initialQ={q}
        initialStatus={status === "active" || status === "inactive" ? status : "all"}
        initialSort={
          [
            "newest",
            "oldest",
            "name_asc",
            "name_desc",
            "price_asc",
            "price_desc",
            "stock_asc",
            "stock_desc",
          ].includes(sort)
            ? (sort as any)
            : "newest"
        }
      />

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      ) : null}

      {/* Products Table */}
      {(products ?? []).length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Variants
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date Added
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(products ?? []).map((p) => {
                const firstImage = (p.product_images as Array<{ url: string }>)?.[0]?.url;
                const stockQty = typeof (p as any).stock_qty === "number" ? ((p as any).stock_qty as number) : 0;
                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
                          {firstImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={firstImage} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{p.name}</p>
                          <p className="truncate text-sm text-slate-500">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        R{(p.price_cents / 100).toFixed(2)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          stockQty <= 0
                            ? "bg-red-100 text-red-700"
                            : stockQty <= 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {stockQty}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        p.active 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        p.has_variants 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {p.has_variants ? "Has Variants" : "Simple"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(p.created_at).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <DeleteProductButton productId={p.id} productName={p.name} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No products yet</h3>
          <p className="mt-1 text-sm text-slate-500">Get started by adding your first product</p>
          <Link
            href="/admin/products/new"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
