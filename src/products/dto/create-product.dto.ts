import { z } from 'zod';

const priceSchema = z
  .number()
  .finite()
  .positive()
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
    message: 'Price must have no more than two decimal places',
  });

export const createProductSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(2000),
    price: priceSchema,
    stock: z.number().int().min(0),
    categoryId: z.string().regex(/^[\da-f]{24}$/i).optional(),
  })
  .strict();

export type CreateProductInput = z.output<typeof createProductSchema>;
