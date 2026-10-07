import type { Database } from '@/types/database';
export type Notification = Database['public']['Tables']['notifications']['Row'];
export const eventLabels: Record<string, string> = {
  TASK_ASSIGNED: 'Asignación de tarea',
  TASK_REVIEW: 'Tarea en revisión',
  TASK_RETURNED: 'Tarea devuelta',
  TASK_APPROVED: 'Tarea aprobada',
  TASK_OVERDUE: 'Tarea vencida',
  EVIDENCE_UPLOADED: 'Nueva evidencia',
  EVIDENCE_ACCEPTED: 'Evidencia aceptada',
  EVIDENCE_REJECTED: 'Evidencia rechazada',
  EVIDENCE_CHANGES_REQUESTED: 'Cambios en evidencia',
  FINDING_REVIEW: 'Hallazgo en revisión',
};
export function notificationHref(n: Notification) {
  if (n.evidence_id) return `/evidence/${n.evidence_id}`;
  if (n.task_id) return `/tasks/${n.task_id}`;
  if (n.finding_id) return `/findings/${n.finding_id}`;
  return `/organizations/${n.organization_id}`;
}
