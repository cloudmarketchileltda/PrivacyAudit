import { calendarDate } from '@/features/workflow/schemas';
import Link from 'next/link';
import { ActivityDescription } from '@/features/workflow/activity';
import { taskScope, assignees } from '@/features/workflow/queries';
import { taskLabels, severityLabels } from '@/features/workflow/schemas';
import { WorkflowNav } from '@/features/workflow/nav';
import { ActionForm } from '@/components/forms';
import { submitTask } from '@/features/workflow/actions';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, task: t, finding, organization, canEdit, user, manager } = await taskScope(id);
  const [members, { data: logs, error: logError }] = await Promise.all([
    assignees(organization.id),
    manager
      ? db
          .from('audit_logs')
          .select('*')
          .eq('entity_id', id)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (logError) throw new Error('No se pudo cargar la actividad.');
  const canSubmit =
    !manager &&
    t.assigned_to === user.id &&
    organization.status === 'ACTIVE' &&
    !['CLOSED', 'ACCEPTED_RISK'].includes(finding.status) &&
    ['TODO', 'IN_PROGRESS'].includes(t.status);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="muted">{organization.legal_name}</p>
          <h1 className="page-title break-words">{t.title}</h1>
        </div>
        {canEdit && (
          <Button asChild variant="outline">
            <Link href={`/tasks/${id}/edit`}>Editar tarea</Link>
          </Button>
        )}
      </div>
      <WorkflowNav org={organization.id} />
      <section className="panel">
        <dl className="form-grid">
          {[
            ['Estado', taskLabels[t.status]],
            ['Prioridad', severityLabels[t.priority]],
            ['Fecha objetivo', calendarDate(t.due_date)],
            [
              'Responsable',
              t.assigned_to === user.id
                ? 'Usted'
                : members.find((m) => m.id === t.assigned_to)?.full_name ||
                  (t.assigned_to ? 'Miembro asignado' : 'Sin asignar'),
            ],
            ['Descripción', t.description],
            ['Observaciones del consultor', t.reviewer_comment],
            ['Creada', formatDate(t.created_at)],
            ['Aprobada', t.completed_at ? formatDate(t.completed_at) : ''],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="muted">{label}</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap break-words">
                {value || 'Sin registrar'}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6">
          <Link className="underline text-teal-800 text-sm" href={`/findings/${finding.id}`}>
            Hallazgo: {finding.title}
          </Link>
        </p>
      </section>
      {manager && (
        <section className="panel">
          <h2 className="section-title">Actividad de la tarea</h2>
          <p className="muted mb-4">Últimos 50 eventos.</p>
          <ul className="space-y-3">
            {logs?.map((l) => (
              <li key={l.id} className="text-sm border-b border-slate-100 pb-3">
                <p>
                  {formatDate(l.created_at)} ·{' '}
                  {l.action === 'CREATE' ? 'Creación' : 'Actualización'} ·{' '}
                  {members.find((m) => m.id === l.actor_id)?.full_name || 'Usuario'}
                </p>
                <ActivityDescription metadata={l.metadata} kind="task" members={members} />
              </li>
            ))}
          </ul>
        </section>
      )}
      {!manager && t.status === 'WAITING_REVIEW' && (
        <p role="status" className="success-message">
          Tarea enviada a revisión. Está pendiente de evaluación por el consultor.
        </p>
      )}
      {canSubmit && (
        <section className="panel">
          <h2 className="section-title">Actualizar mi tarea</h2>
          <p className="muted mb-4">
            Al terminar su trabajo, envíe la tarea a revisión. La aprobación corresponde al
            consultor.
          </p>
          <ActionForm action={submitTask} label="Actualizar mi tarea">
            <input type="hidden" name="task" value={id} />
            <label className="form-label">
              Nuevo estado
              <select name="new_status" className="field" defaultValue="WAITING_REVIEW">
                <option value="IN_PROGRESS">En progreso</option>
                <option value="WAITING_REVIEW">Enviar a revisión</option>
              </select>
            </label>
          </ActionForm>
        </section>
      )}
    </>
  );
}
