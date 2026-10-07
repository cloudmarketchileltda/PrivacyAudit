import { calendarDate } from '@/features/workflow/schemas';
import Link from 'next/link';
import { ActivityDescription } from '@/features/workflow/activity';
import { findingScope, assignees } from '@/features/workflow/queries';
import {
  findingLabels,
  severityLabels,
  taskLabels,
  findingCode,
} from '@/features/workflow/schemas';
import { WorkflowNav } from '@/features/workflow/nav';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, finding: f, organization, canEdit, manager } = await findingScope(id);
  const [
    { data: tasks, error: taskError },
    { data: assessment, error: assessmentError },
    { data: control, error: controlError },
    { data: logs, error: logError },
    { data: progress, error: progressError },
    members,
  ] = await Promise.all([
    db.from('tasks').select('*').eq('finding_id', id).order('created_at').limit(100),
    db.from('assessments').select('name').eq('id', f.assessment_id).single(),
    f.control_id
      ? db.from('assessment_controls').select('snapshot').eq('id', f.control_id).single()
      : Promise.resolve({ data: null, error: null }),
    manager
      ? db
          .from('audit_logs')
          .select('*')
          .eq('entity_id', id)
          .order('created_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
    db.rpc('finding_progress', { finding: id }),
    assignees(organization.id),
  ]);
  if (taskError || assessmentError || controlError || logError || progressError)
    throw new Error('No se pudo cargar el detalle del hallazgo.');
  const totals = progress as { total: number; done: number };
  const snapshot = control?.snapshot as { code: string; title: string } | undefined;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="muted">
            {organization.legal_name} · {findingCode(f.code)}
          </p>
          <h1 className="page-title break-words">{f.title}</h1>
        </div>
        {canEdit && (
          <Button asChild variant="outline">
            <Link href={`/findings/${id}/edit`}>Editar hallazgo</Link>
          </Button>
        )}
      </div>
      <WorkflowNav org={organization.id} />
      <section className="panel">
        <dl className="form-grid">
          {[
            ['Estado', findingLabels[f.status]],
            ['Severidad', severityLabels[f.severity]],
            [
              'Responsable',
              members.find((m) => m.id === f.assigned_to)?.full_name ||
                (f.assigned_to ? 'Miembro asignado' : 'Sin asignar'),
            ],
            ['Fecha objetivo', calendarDate(f.due_date)],
            ['Área', f.area],
            ['Progreso', `${totals.done}/${totals.total} tareas aprobadas`],
            ['Descripción', f.description],
            ['Recomendación', f.recommendation],
            ['Justificación de cierre o riesgo aceptado', f.closure_note],
            ['Creado', formatDate(f.created_at)],
            ['Cerrado', f.closed_at ? formatDate(f.closed_at) : ''],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="muted">{label}</dt>
              <dd className="mt-1 text-sm whitespace-pre-wrap break-words">
                {value || 'Sin registrar'}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 space-y-2">
          <p>
            <Link
              className="text-sm underline text-teal-800"
              href={`/assessments/${f.assessment_id}`}
            >
              Evaluación: {assessment?.name}
            </Link>
          </p>
          {snapshot && (
            <p>
              <Link
                className="text-sm underline text-teal-800"
                href={`/assessments/${f.assessment_id}/controls/${f.control_id}`}
              >
                Control histórico: {snapshot.code} · {snapshot.title}
              </Link>
            </p>
          )}
        </div>
      </section>
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Tareas correctivas</h2>
          {canEdit && !['CLOSED', 'ACCEPTED_RISK'].includes(f.status) && (
            <Button asChild>
              <Link href={`/tasks/new?finding=${id}`}>Nueva tarea</Link>
            </Button>
          )}
        </div>
        <p className="muted my-4">
          {manager
            ? 'El cierre exige aprobar todas las tareas.'
            : 'Solo puede consultar las tareas asignadas a usted. El progreso incluye todas las tareas del hallazgo.'}
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Fecha objetivo</th>
              </tr>
            </thead>
            <tbody>
              {tasks?.map((t) => (
                <tr key={t.id}>
                  <td className="min-w-48 max-w-sm break-words">
                    <Link
                      className="text-teal-800 font-semibold hover:underline"
                      href={`/tasks/${t.id}`}
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td>{severityLabels[t.priority]}</td>
                  <td>{taskLabels[t.status]}</td>
                  <td>{calendarDate(t.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tasks?.length && <p className="empty">No hay tareas disponibles.</p>}
        </div>
        <Link
          className="text-sm underline mt-4 inline-block"
          href={`/tasks?organization=${organization.id}&finding=${id}`}
        >
          Ver todas las tareas de este hallazgo
        </Link>
      </section>
      {manager && (
        <section className="panel">
          <h2 className="section-title">Actividad del hallazgo</h2>
          <p className="muted mb-4">Últimos 50 eventos.</p>
          <ul className="space-y-3">
            {logs?.map((l) => (
              <li key={l.id} className="text-sm border-b border-slate-100 pb-3">
                <p>
                  {formatDate(l.created_at)} ·{' '}
                  {l.action === 'CREATE' ? 'Creación' : 'Actualización'} ·{' '}
                  {members.find((m) => m.id === l.actor_id)?.full_name || l.actor_id}
                </p>
                <ActivityDescription metadata={l.metadata} kind="finding" members={members} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
