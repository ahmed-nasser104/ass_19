import { z } from 'zod';
import { createProductSchema } from './create-product.dto.js';

export const updateProductSchema = createProductSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field must be provided',
);

export type UpdateProductInput = z.output<typeof updateProductSchema>;
