import { z } from "zod";

export const createOrderSchema = z.object({
  customer: z.object({
    email: z.string().email(),
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(5).optional(),
  }),
  shippingAddress: z.object({
    line1: z.string().trim().min(1),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(1),
    province: z.string().trim().min(1),
    postal_code: z.string().trim().min(1),
    country: z.string().trim().min(2).default("ZA"),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable(),
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1),
  couponCode: z.string().trim().min(1).max(64).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
