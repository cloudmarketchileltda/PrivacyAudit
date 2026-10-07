import type { Database, Json } from '@/types/database';
import { findingLabels, taskLabels, severityLabels } from './schemas';
export function ActivityDescription({
  metadata,
  kind,
  members,
}: {
  metadata: Json;
  kind: 'finding' | 'task';
  members: { id: string; full_name: string }[];
}) {
  const m = metadata as Record<string, Json>;
  const statuses = kind === 'finding' ? findingLabels : taskLabels;
  const status = (key: Json) =>
    statuses[String(key) as keyof typeof statuses] || String(key || 'Sin estado');
  const priority = (key: Json) =>
    severityLabels[String(key) as keyof typeof severityLabels] || String(key || 'Sin prioridad');
  const member = (key: Json) =>
    members.find((x) => x.id === key)?.full_name || (key ? 'Miembro asignado' : 'Sin asignar');
  return (
    <div className="muted space-y-1">
      <p>
        Estado: {m.previous_status ? `${status(m.previous_status)} → ` : ''}
        {status(m.status)}
      </p>
      <p>
        Prioridad: {m.previous_priority ? `${priority(m.previous_priority)} → ` : ''}
        {priority(m.priority)}
      </p>
      <p>
        Responsable: {m.previous_assigned_to ? `${member(m.previous_assigned_to)} → ` : ''}
        {member(m.assigned_to)}
      </p>
      {m.reviewer_comment && (
        <p className="whitespace-pre-wrap break-words">
          Observaciones: {String(m.reviewer_comment)}
        </p>
      )}
      {m.closure_note && (
        <p className="whitespace-pre-wrap break-words">Justificación: {String(m.closure_note)}</p>
      )}
    </div>
  );
}
export type Activity = Database['public']['Tables']['audit_logs']['Row'];
