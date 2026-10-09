import { z } from '@/lib/validation';
import { generalConfig } from '@/config/general';
import { controlStatuses, snapshotSchema } from '@/features/assessments/model';
import { processingSchema } from '@/features/processing/schemas';
const text = z.string();
const nullableText = text.nullable();
const severity = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const reportInputSchema = z.object({
  assessment: z.uuid(),
  report_title: text.trim().min(2).max(generalConfig.reports.titleMaxLength),
  executive_summary: text
    .trim()
    .min(generalConfig.reports.textMinLength)
    .max(generalConfig.reports.textMaxLength),
  report_scope: text
    .trim()
    .min(generalConfig.reports.textMinLength)
    .max(generalConfig.reports.textMaxLength),
  conclusions: text
    .trim()
    .min(generalConfig.reports.textMinLength)
    .max(generalConfig.reports.textMaxLength),
});
export const reportSnapshotSchema = z.object({
  version: z.literal(1),
  captured_at: text,
  organization: z.object({ id: z.uuid(), legal_name: text, rut: text }),
  assessment: z.object({
    id: z.uuid(),
    name: text,
    description: text,
    status: z.enum(['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']),
    started_at: nullableText,
    completed_at: nullableText,
  }),
  consultant: text,
  author: text,
  executive_summary: text,
  scope: text,
  conclusions: text,
  controls: z.array(
    z.object({
      id: z.uuid(),
      snapshot: snapshotSchema,
      status: z.enum(controlStatuses),
      auditor_comment: text,
      applicability_reason: text,
    }),
  ),
  findings: z.array(
    z.object({
      id: z.uuid(),
      control_id: z.uuid().nullable(),
      code: z.number(),
      title: text,
      description: text,
      recommendation: text,
      area: text,
      severity,
      status: z.enum(['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW', 'CLOSED', 'ACCEPTED_RISK']),
      assignee_name: text,
      due_date: nullableText,
      closure_note: text,
    }),
  ),
  tasks: z.array(
    z.object({
      id: z.uuid(),
      finding_id: z.uuid(),
      title: text,
      description: text,
      assignee_name: text,
      status: z.enum(['TODO', 'IN_PROGRESS', 'WAITING_REVIEW', 'DONE']),
      priority: severity,
      due_date: nullableText,
      reviewer_comment: text,
    }),
  ),
  processing: z.array(processingSchema),
  evidence: z.array(
    z.object({
      id: z.uuid(),
      control_id: nullableText,
      finding_id: nullableText,
      task_id: nullableText,
      previous_evidence_id: nullableText,
      original_filename: text,
      description: text,
      review_status: z.enum(['ACCEPTED', 'REJECTED', 'CHANGES_REQUESTED']),
      reviewer_comment: text,
      reviewed_at: text,
      reviewer_name: text,
    }),
  ),
});
export type ReportSnapshot = z.infer<typeof reportSnapshotSchema>;
export const reportDisclaimer =
  'Este informe constituye una herramienta de diagnóstico y apoyo a la gestión del cumplimiento. No constituye por sí mismo una certificación legal de cumplimiento ni reemplaza el análisis jurídico o profesional que pueda resultar necesario.';
export function reportMetrics(snapshot: ReportSnapshot) {
  const counts = Object.fromEntries(
    controlStatuses.map((s) => [s, snapshot.controls.filter((c) => c.status === s).length]),
  ) as Record<(typeof controlStatuses)[number], number>;
  const total = snapshot.controls.length;
  const evaluated = total - counts.PENDING;
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: generalConfig.reports.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(snapshot.captured_at));
  return {
    counts,
    total,
    evaluated,
    progress: total ? Math.round((evaluated / total) * 100) : 0,
    open: snapshot.findings.filter((f) => !['CLOSED', 'ACCEPTED_RISK'].includes(f.status)).length,
    overdue: snapshot.tasks.filter((t) => t.status !== 'DONE' && t.due_date && t.due_date < day)
      .length,
  };
}
export function reportDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: generalConfig.reports.timeZone,
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}
