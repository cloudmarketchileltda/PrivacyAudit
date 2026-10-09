import { z } from '@/lib/validation';
import type { Database } from '@/types/database';
export const controlStatuses = [
  'PENDING',
  'CONFORM',
  'PARTIAL',
  'NON_CONFORM',
  'NOT_APPLICABLE',
] as const;
export type ControlStatus = (typeof controlStatuses)[number];
export const controlLabels: Record<ControlStatus, string> = {
  PENDING: 'Pendiente',
  CONFORM: 'Conforme',
  PARTIAL: 'Parcial',
  NON_CONFORM: 'No conforme',
  NOT_APPLICABLE: 'No aplica',
};
export const assessmentLabels = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En progreso',
  REVIEW: 'En revisión',
  COMPLETED: 'Completada',
} as const;
export interface ControlSnapshot {
  code: string;
  title: string;
  description: string;
  category: string;
  objective: string;
  guidance: string;
  normative_reference: string;
  legal_review_status: 'PENDING' | 'REVIEWED';
  severity_if_failed: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requires_evidence: boolean;
  sort_order: number;
}
export interface Assessment {
  deletion_pending: boolean;
  id: string;
  organization_id: string;
  name: string;
  description: string;
  status: keyof typeof assessmentLabels;
  consultant_id: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface ResponseControl {
  id: string;
  assessment_id: string;
  organization_id: string;
  control_id: string;
  snapshot: ControlSnapshot;
  status: ControlStatus;
  auditor_comment: string;
  client_comment: string;
  applicability_reason: string;
  evaluated_by: string | null;
  evaluated_at: string | null;
}
export function evaluationMetrics(items: { status: ControlStatus }[]) {
  const counts = Object.fromEntries(controlStatuses.map((s) => [s, 0])) as Record<
    ControlStatus,
    number
  >;
  for (const item of items) counts[item.status]++;
  const total = items.length,
    evaluated = total - counts.PENDING;
  return { total, evaluated, progress: total ? Math.round((evaluated / total) * 100) : 0, counts };
}

export const snapshotSchema = z.object({
  code: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  objective: z.string(),
  guidance: z.string(),
  normative_reference: z.string(),
  legal_review_status: z.enum(['PENDING', 'REVIEWED']),
  severity_if_failed: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  requires_evidence: z.boolean(),
  sort_order: z.number(),
});
export function responseFromRow(
  row: Database['public']['Tables']['assessment_controls']['Row'],
): ResponseControl {
  return { ...row, snapshot: snapshotSchema.parse(row.snapshot) };
}
