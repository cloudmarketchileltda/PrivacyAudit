import { z } from '@/lib/validation';
export const severityLabels = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
} as const;
export const findingLabels = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En progreso',
  UNDER_REVIEW: 'En revisión',
  CLOSED: 'Cerrado',
  ACCEPTED_RISK: 'Riesgo aceptado',
} as const;
export const taskLabels = {
  TODO: 'Por hacer',
  IN_PROGRESS: 'En progreso',
  WAITING_REVIEW: 'Pendiente de revisión',
  DONE: 'Aprobada',
} as const;
const uuidOrEmpty = z.union([z.uuid(), z.literal('')]);
export const workflowSchema = z
  .object({
    kind: z.enum(['finding', 'task']),
    organization_id: z.uuid(),
    id: uuidOrEmpty,
    assessment_id: uuidOrEmpty,
    control_id: uuidOrEmpty,
    finding_id: uuidOrEmpty,
    title: z.string().trim().min(2, 'Ingrese un título de al menos dos caracteres.').max(200),
    description: z.string().trim().max(10000),
    recommendation: z.string().trim().max(10000),
    area: z.string().trim().max(200),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    status: z.string(),
    assigned_to: uuidOrEmpty,
    due_date: z.union([z.iso.date(), z.literal('')]),
    closure_note: z.string().trim().max(10000),
    reviewer_comment: z.string().trim().max(10000),
  })
  .superRefine((v, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    if (v.kind === 'finding') {
      if (!v.assessment_id) add('assessment_id', 'Seleccione una evaluación.');
      if (v.description.length < 2) add('description', 'Describa el hallazgo.');
      if (!Object.hasOwn(findingLabels, v.status)) add('status', 'Estado de hallazgo inválido.');
      if (['CLOSED', 'ACCEPTED_RISK'].includes(v.status) && !v.closure_note)
        add('closure_note', 'Justifique el cierre o la aceptación del riesgo.');
    } else {
      if (!v.finding_id) add('finding_id', 'Seleccione un hallazgo.');
      if (!Object.hasOwn(taskLabels, v.status)) add('status', 'Estado de tarea inválido.');
      if (!v.id && v.status !== 'TODO') add('status', 'Una tarea comienza por hacer.');
    }
  });
export type WorkflowInput = z.input<typeof workflowSchema>;
export function findingCode(code: number) {
  return `H-${String(code).padStart(5, '0')}`;
}

export function calendarDate(value: string | null) {
  return value ? value.slice(0, 10).split('-').reverse().join('-') : 'Sin fecha';
}
