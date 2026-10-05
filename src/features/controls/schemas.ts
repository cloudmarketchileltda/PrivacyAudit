import { z } from '@/lib/validation';
export const controlSchema = z.object({
  code: z.string().trim().min(2).max(30),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000),
  category: z.string().trim().min(2).max(200),
  objective: z.string().trim().max(3000),
  guidance: z.string().trim().max(10000),
  normative_reference: z.string().trim().max(5000),
  legal_review_status: z.enum(['PENDING', 'REVIEWED']),
  severity_if_failed: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  requires_evidence: z.boolean(),
  active: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(10000),
});
