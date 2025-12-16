"use client";

import { useState } from "react";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductCategoriesEditor } from "@/components/admin/ProductCategoriesEditor";
import { ProductImagesManager } from "@/components/admin/ProductImagesManager";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import type { ProductUpsertInput } from "@/lib/admin/productSchemas";

export function EditProductClient({
  productId,
  initial,
  categories,
  initialCategoryIds,
  initialImages,
}: {
  productId: string;
  initial: Partial<ProductUpsertInput>;
  categories: { id: string; name: string; slug: string }[];
  initialCategoryIds: string[];
  initialImages: Array<{ id: string; url: string; sort_order: number }>;
}) {
  const [hasVariants, setHasVariants] = useState(Boolean(initial.has_variants));
  const formId = `product-form-${productId}`;

  return (
    <div className="space-y-6">
      <ProductForm
        mode="edit"
        productId={productId}
        initial={initial}
        onHasVariantsChange={setHasVariants}
      />

      <ProductCategoriesEditor
        productId={productId}
        categories={categories}
        initialCategoryIds={initialCategoryIds}
      />

      <ProductImagesManager productId={productId} initialImages={initialImages} />

      {hasVariants ? <ProductVariantsEditor productId={productId} /> : null}

      <div className="sticky bottom-0 z-40 -mx-6 border-t bg-white/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-end">
          <button
            type="submit"
            form={formId}
            className="h-11 rounded-md bg-black px-5 text-sm text-white disabled:opacity-60"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
