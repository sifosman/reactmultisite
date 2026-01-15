"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { productUpsertSchema, type ProductUpsertInput } from "@/lib/admin/productSchemas";

type BulkRow = {
  name: string;
  description: string;
  regularPriceRands: string;
  salePriceRands: string;
  stockQty: string;
  active: boolean;
  imageFile: File | null;
  galleryImageUrl: string | null;
  categorySlug: string;
};

function randsStringToCents(value: string) {
  const normalized = value.replaceAll(",", ".").trim();
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createEmptyRow(): BulkRow {
  return {
    name: "",
    description: "",
    regularPriceRands: "",
    salePriceRands: "",
    stockQty: "0",
    active: true,
    imageFile: null,
    galleryImageUrl: null,
    categorySlug: "",
  };
}

const ROW_COUNT = 100;

export function BulkProductUpload() {
  const [rows, setRows] = useState<BulkRow[]>(() =>
    Array.from({ length: ROW_COUNT }, () => createEmptyRow())
  );
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalUploadInputRef = useRef<HTMLInputElement | null>(null);

  type GalleryImage = { url: string };
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryTargetRow, setGalleryTargetRow] = useState<number | null>(null);
  const [loadingGallery, setLoadingGallery] = useState(false);

  const nonEmptyRowIndexes = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => {
          return (
            row.name.trim() !== "" ||
            row.description.trim() !== "" ||
            row.regularPriceRands.trim() !== "" ||
            row.salePriceRands.trim() !== "" ||
            row.stockQty.trim() !== "0"
          );
        })
        .map(({ index }) => index),
    [rows]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResultMessage(null);
    setErrorMessage(null);

    if (nonEmptyRowIndexes.length === 0) {
      setErrorMessage("Please fill in at least one row.");
      return;
    }

    setSubmitting(true);

    let createdCount = 0;
    let imageUploadedCount = 0;
    const rowErrors: { index: number; message: string }[] = [];

    // Load categories once to resolve category slugs to IDs
    let categoryBySlug = new Map<string, string>();
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.categories)) {
        for (const c of json.categories as Array<{ id: string; slug: string }>) {
          if (c.slug) {
            categoryBySlug.set(String(c.slug).toLowerCase(), c.id);
          }
        }
      }
    } catch {
      // If categories cannot be loaded, we'll still try to create products, but category assignment will fail per-row.
      categoryBySlug = new Map();
    }

    for (const index of nonEmptyRowIndexes) {
      const row = rows[index];
      const name = row.name.trim();
      const slug = slugifyName(name || `product-${Date.now()}-${index + 1}`);
      const description = row.description.trim() || undefined;
      const price_cents = randsStringToCents(row.regularPriceRands || "0");
      const saleCents = row.salePriceRands.trim()
        ? randsStringToCents(row.salePriceRands)
        : null;

      const finalPriceCents = saleCents != null ? saleCents : price_cents;
      const compareAtCents = saleCents != null ? price_cents : null;
      const stock_qty = Number(row.stockQty.replace(/[^0-9]/g, "")) || 0;

      const payload: ProductUpsertInput = {
        name,
        slug,
        description,
        price_cents: finalPriceCents,
        compare_at_price_cents: compareAtCents ?? undefined,
        stock_qty,
        active: row.active,
        has_variants: false,
      };

      const parsed = productUpsertSchema.safeParse(payload);
      if (!parsed.success) {
        rowErrors.push({
          index,
          message: "Validation failed (name required, price non-negative, slug must be kebab-case)",
        });
        continue;
      }

      try {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          rowErrors.push({ index, message: json?.error || "Create failed" });
          continue;
        }

        const productId = json?.id as string | undefined;
        createdCount += 1;

        if (productId) {
          // Assign category if a slug was provided and resolved
          const slug = row.categorySlug.trim().toLowerCase();
          if (slug) {
            const categoryId = categoryBySlug.get(slug);
            if (categoryId) {
              try {
                const catRes = await fetch(`/api/admin/products/${productId}/categories`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ categoryIds: [categoryId] }),
                });
                if (!catRes.ok) {
                  const catJson = await catRes.json().catch(() => null);
                  rowErrors.push({
                    index,
                    message: catJson?.error || "Category assign failed",
                  });
                }
              } catch {
                rowErrors.push({ index, message: "Category assign failed" });
              }
            } else {
              rowErrors.push({ index, message: `Unknown category slug \"${row.categorySlug}\"` });
            }
          }

          if (row.imageFile) {
            const form = new FormData();
            form.set("file", row.imageFile);
            form.set("sort_order", "0");

            const imgRes = await fetch(`/api/admin/products/${productId}/images`, {
              method: "POST",
              body: form,
            });

            if (imgRes.ok) {
              imageUploadedCount += 1;
            } else {
              const imgJson = await imgRes.json().catch(() => null);
              rowErrors.push({
                index,
                message: imgJson?.error || "Image upload failed",
              });
            }
          } else if (row.galleryImageUrl) {
            // Support multiple URLs separated by | in the galleryImageUrl field
            const urls = row.galleryImageUrl
              .split("|")
              .map((v) => v.trim())
              .filter(Boolean);
            for (const url of urls) {
              const resAttach = await fetch(`/api/admin/products/${productId}/images-from-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
              });

              if (resAttach.ok) {
                imageUploadedCount += 1;
              } else {
                const attachJson = await resAttach.json().catch(() => null);
                rowErrors.push({
                  index,
                  message: attachJson?.error || "Gallery image attach failed",
                });
              }
            }
          }
        }
      } catch (err) {
        rowErrors.push({ index, message: "Network error" });
      }
    }

    setSubmitting(false);

    if (rowErrors.length === 0) {
      setResultMessage(
        `Successfully created ${createdCount} product${createdCount === 1 ? "" : "s"}$${
          imageUploadedCount > 0
            ? ` and uploaded ${imageUploadedCount} image${imageUploadedCount === 1 ? "" : "s"}`
            : ""
        }.`
      );
    } else {
      const failedCount = rowErrors.length;
      setResultMessage(
        `Created ${createdCount} product${createdCount === 1 ? "" : "s"}. ${failedCount} row${
          failedCount === 1 ? "" : "s"
        } had issues.`
      );
      setErrorMessage(
        rowErrors
          .map((e) => `Row ${e.index + 1}: ${e.message}`)
          .join("\n")
      );
    }
  }

  function updateRow<T extends keyof BulkRow>(index: number, key: T, value: BulkRow[T]) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value } as BulkRow;
      return next;
    });
  }

  function handleClearAll() {
    setRows(Array.from({ length: ROW_COUNT }, () => createEmptyRow()));
    setResultMessage(null);
    setErrorMessage(null);
  }

  function buildCsv(): string {
    const header = [
      "name",
      "description",
      "regular_price_zar",
      "sale_price_zar",
      "stock_qty",
      "active",
      "image_urls (optional, pipe-separated)",
      "category_slug (optional)",
    ];

    const lines = [header.join(",")];

    rows.forEach((row) => {
      if (
        row.name.trim() === "" &&
        row.description.trim() === "" &&
        row.regularPriceRands.trim() === "" &&
        row.salePriceRands.trim() === "" &&
        row.stockQty.trim() === "0" &&
        !row.galleryImageUrl
      ) {
        return;
      }

      const fields = [
        row.name,
        row.description,
        row.regularPriceRands,
        row.salePriceRands,
        row.stockQty,
        row.active ? "true" : "false",
        row.galleryImageUrl ?? "",
        row.categorySlug ?? "",
      ];

      lines.push(
        fields
          .map((f) => {
            const v = f.replace(/"/g, '""');
            return /[",\n]/.test(v) ? `"${v}"` : v;
          })
          .join(",")
      );
    });

    return lines.join("\n");
  }

  function handleDownloadTemplate() {
    const csv = buildCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-products-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) return;

    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

    function getIndex(name: string) {
      return headers.indexOf(name);
    }

    const idxName = getIndex("name");
    const idxDesc = getIndex("description");
    const idxRegular = getIndex("regular_price_zar");
    const idxSale = getIndex("sale_price_zar");
    const idxStock = getIndex("stock_qty");
    const idxActive = getIndex("active");
    const idxImageUrl = headers.findIndex((h) => h.startsWith("image_url"));
    const idxCategorySlug = getIndex("category_slug");

    const nextRows: BulkRow[] = Array.from({ length: ROW_COUNT }, () => createEmptyRow());

    dataLines.slice(0, ROW_COUNT).forEach((line, lineIdx) => {
      const parts = line.split(",");
      const row = nextRows[lineIdx];

      if (idxName >= 0) row.name = (parts[idxName] ?? "").trim();
      if (idxDesc >= 0) row.description = (parts[idxDesc] ?? "").trim();
      if (idxRegular >= 0) row.regularPriceRands = (parts[idxRegular] ?? "").trim();
      if (idxSale >= 0) row.salePriceRands = (parts[idxSale] ?? "").trim();
      if (idxStock >= 0) row.stockQty = (parts[idxStock] ?? "0").trim();
      if (idxActive >= 0) {
        const v = (parts[idxActive] ?? "").trim().toLowerCase();
        row.active = v === "true" || v === "1" || v === "yes";
      }
      if (idxImageUrl >= 0) {
        const v = (parts[idxImageUrl] ?? "").trim();
        row.galleryImageUrl = v || null;
      }
      if (idxCategorySlug >= 0) {
        row.categorySlug = (parts[idxCategorySlug] ?? "").trim();
      }
    });

    setRows(nextRows);
  }

  function handleUploadCsvClick() {
    fileInputRef.current?.click();
  }

  function handleCsvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      parseCsv(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function openGalleryForRow(index: number) {
    setGalleryTargetRow(index);
    setLoadingGallery(true);
    setGalleryOpen(true);
    try {
      const res = await fetch("/api/admin/products/images-gallery");
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.images)) {
        setGalleryImages(json.images as GalleryImage[]);
      } else {
        setGalleryImages([]);
      }
    } finally {
      setLoadingGallery(false);
    }
  }

  function handleSelectGalleryImage(url: string) {
    if (galleryTargetRow == null) return;
    updateRow(galleryTargetRow, "galleryImageUrl", url);
    updateRow(galleryTargetRow, "imageFile", null);
    setGalleryOpen(false);
  }

  function handleModalUploadClick(rowIndex: number) {
    setGalleryTargetRow(rowIndex);
    modalUploadInputRef.current?.click();
  }

  function handleModalUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || galleryTargetRow == null) {
      e.target.value = "";
      return;
    }

    updateRow(galleryTargetRow, "imageFile", file);
    updateRow(galleryTargetRow, "galleryImageUrl", null);
    setGalleryOpen(false);
    e.target.value = "";
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 text-sm text-slate-600">
          <div>
            Fill in up to {ROW_COUNT} simple products. Leave rows blank if not needed. Slugs will be
            generated from the name.
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-md border px-3 py-1.5 hover:bg-slate-50"
            >
              Clear all rows
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="rounded-md border px-3 py-1.5 hover:bg-slate-50"
            >
              Download CSV template
            </button>
            <button
              type="button"
              onClick={handleUploadCsvClick}
              className="rounded-md border px-3 py-1.5 hover:bg-slate-50"
            >
              Upload CSV
            </button>
            <Link
              href="/admin/categories/new"
              target="_blank"
              className="rounded-md border px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Add category
            </Link>
            <input
              type="file"
              accept=".csv,text/csv"
              ref={fileInputRef}
              onChange={handleCsvFileChange}
              className="hidden"
            />
          </div>
        </div>
        <button
          type="submit"
          className="h-11 rounded-md bg-black px-5 text-sm text-white disabled:opacity-60"
          disabled={submitting || nonEmptyRowIndexes.length === 0}
        >
          {submitting
            ? `Uploading ${nonEmptyRowIndexes.length} product${
                nonEmptyRowIndexes.length === 1 ? "" : "s"
              }...`
            : `Create ${nonEmptyRowIndexes.length || "0"} products`}
        </button>
      </div>

      {resultMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 whitespace-pre-line">
          {resultMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-pre-line">
          {errorMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  #
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Name
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Regular price (ZAR)
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sale price (ZAR)
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock qty
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Active
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Image
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Category slug
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-xs text-slate-500">{index + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      className="h-9 w-full rounded-md border px-2 text-xs"
                      value={row.name}
                      onChange={(e) => updateRow(index, "name", e.target.value)}
                      placeholder="Product name"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="h-9 w-full rounded-md border px-2 text-xs"
                      value={row.description}
                      onChange={(e) => updateRow(index, "description", e.target.value)}
                      placeholder="Optional description"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="h-9 w-full rounded-md border px-2 text-xs"
                      value={row.regularPriceRands}
                      onChange={(e) => updateRow(index, "regularPriceRands", e.target.value)}
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="h-9 w-full rounded-md border px-2 text-xs"
                      value={row.salePriceRands}
                      onChange={(e) => updateRow(index, "salePriceRands", e.target.value)}
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Optional"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="h-9 w-20 rounded-md border px-2 text-xs"
                      value={row.stockQty}
                      onChange={(e) =>
                        updateRow(index, "stockQty", e.target.value.replace(/[^0-9]/g, ""))
                      }
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={(e) => updateRow(index, "active", e.target.checked)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => openGalleryForRow(index)}
                        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        Choose image
                      </button>
                      {row.imageFile ? (
                        <span className="truncate max-w-[180px] text-[11px] text-slate-600">
                          From device: {row.imageFile.name}
                        </span>
                      ) : null}
                      {!row.imageFile && row.galleryImageUrl ? (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="truncate max-w-[160px]">Gallery: {row.galleryImageUrl}</span>
                          <button
                            type="button"
                            className="text-[10px] text-red-500 hover:underline"
                            onClick={() => updateRow(index, "galleryImageUrl", null)}
                          >
                            Clear
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="h-9 w-full rounded-md border px-2 text-xs"
                      value={row.categorySlug}
                      onChange={(e) => updateRow(index, "categorySlug", e.target.value)}
                      placeholder="e.g. bags"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {galleryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-sm font-medium">Choose product image</div>
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-slate-700"
                onClick={() => setGalleryOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-4">
                <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-sm font-medium text-emerald-900">Upload from device</div>
                    <div className="text-xs text-emerald-800/80">
                      Select an image from your computer. It will be uploaded for this product.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (galleryTargetRow != null) {
                        handleModalUploadClick(galleryTargetRow);
                      }
                    }}
                    className="mt-2 inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 sm:mt-0"
                  >
                    Upload image
                  </button>
                </div>
                <input
                  ref={modalUploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleModalUploadChange}
                />
              </div>

              <div>
                <div className="mb-2 text-xs font-medium text-slate-600">Or choose from gallery</div>
                {loadingGallery ? (
                  <div className="text-sm text-slate-500">Loading images...</div>
                ) : galleryImages.length === 0 ? (
                  <div className="text-sm text-slate-500">No gallery images available yet.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        className="overflow-hidden rounded-lg border bg-white text-left hover:border-indigo-500"
                        onClick={() => handleSelectGalleryImage(img.url)}
                      >
                        <div className="aspect-square bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="truncate px-2 py-1 text-[11px] text-slate-600">{img.url}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
