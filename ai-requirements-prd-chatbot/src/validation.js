import { z } from 'zod';
import { HttpError } from './errors.js';

export const STATUSES = ['draft', 'in_progress', 'review', 'completed', 'archived'];

export const projectCreate = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
}).strict();

export const projectUpdate = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(STATUSES).optional(),
}).strict().refine((o) => Object.keys(o).length > 0, 'No fields to update');

export const idParam = z.string().uuid();

export function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, 'Validation failed: ' + r.error.issues.map((i) => `${i.path.join('.') || 'value'} ${i.message}`).join('; '), 'VALIDATION');
  return r.data;
}
