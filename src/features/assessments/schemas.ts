import { z } from '@/lib/validation';
import { controlStatuses } from './model';
export const assessmentSchema = z.object({
  organization_id: z.uuid(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000),
});
export const responseSchema = z
  .object({
    id: z.uuid(),
    status: z.enum(controlStatuses),
    auditor_comment: z.string().trim().max(10000),
    applicability_reason: z.string().trim().max(2000),
  })
  .refine((v) => v.status !== 'NOT_APPLICABLE' || v.applicability_reason.length > 0, {
    path: ['applicability_reason'],
    message: 'Explique por qué el control no aplica.',
  });
