import { z } from 'zod';
import { ORDER_STATUSES } from '../schemas/order.schema.js';

export const createOrderSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            productId: z.string().regex(/^[\da-f]{24}$/i),
            quantity: z.number().int().min(1).max(100),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({ status: z.enum(ORDER_STATUSES) })
  .strict();

export type CreateOrderInput = z.output<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.output<typeof updateOrderStatusSchema>;
