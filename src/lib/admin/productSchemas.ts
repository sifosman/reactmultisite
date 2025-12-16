import { z } from "zod";

export const productUpsertSchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().optional(),
  price_cents: z.number().int().min(0),
  compare_at_price_cents: z.number().int().min(0).nullable().optional(),
  active: z.boolean(),
  has_variants: z.boolean(),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;
