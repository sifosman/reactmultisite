import { z } from "zod";

export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  image_url: z.string().nullable().optional(),
  sort_index: z.number().int().nonnegative().optional(),
});

export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;
