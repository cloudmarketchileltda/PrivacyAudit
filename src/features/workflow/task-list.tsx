import { pageRange } from '@/config/general';
import { calendarDate } from '@/features/workflow/schemas';
import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { z } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import { taskLabels, severityLabels, findingCode } from './schemas';
import { organizationScope, assignees } from './queries';
import { WorkflowNav } from './nav';
export async function TaskList({ params }: { params: Record<string, string | undefined> }) {
  const scope = params.organization ? await organizationScope(params.organization) : null;
  const { db, profile } = scope || (await requireUser());
  const page = pageNumber(params.page),
    q = searchTerm(params.q);
  let query = db.from('tasks').select('*', { count: 'exact' });
  if (scope) query = query.eq('organization_id', scope.organization.id);
  if (z.uuid().safeParse(params.finding).success) query = query.eq('finding_id', params.finding!);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (params.status && Object.hasOwn(taskLabels, params.status))
    query = query.eq('status', params.status as keyof typeof taskLabels);
  if (params.priority && Object.hasOwn(severityLabels, params.priority))
    query = query.eq('priority', params.priority as keyof typeof severityLabels);
  if (z.uuid().safeParse(params.assigned).success)
    query = query.eq('assigned_to', params.assigned!);
  if (params.mine === 'yes') query = query.eq('assigned_to', profile.id);
  if (params.overdue === 'yes')
    query = query
      .lt('due_date', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' }))
      .neq('status', 'DONE');
  const sort =
    params.sort === 'title' ? 'title' : params.sort === 'due_date' ? 'due_date' : 'updated_at';
  const [{ data, count, error }, { data: orgs, error: orgError }, members] = await Promise.all([
    query
      .order(sort, { ascending: sort !== 'updated_at', nullsFirst: false })
      .order('id')
      .range(...pageRange(page)),
    db.from('organizations').select('id,legal_name').order('legal_name'),
    assignees(scope?.organization.id),
  ]);
  if (error || orgError) throw new Error('No se pudieron cargar las tareas.');
  const findingIds = [...new Set(data.map((task) => task.finding_id))];
  const { data: findings, error: findingError } = findingIds.length
    ? await db.from('findings').select('id,title,code,assessment_id').in('id', findingIds)
    : { data: [], error: null };
  if (findingError) throw new Error('No se pudieron cargar los hallazgos de las tareas.');
  const assessmentIds = [...new Set(findings.map((finding) => finding.assessment_id))];
  const { data: assessments, error: assessmentError } = assessmentIds.length
    ? await db.from('assessments').select('id,name').in('id', assessmentIds)
    : { data: [], error: null };
  if (assessmentError) throw new Error('No se pudieron cargar las evaluaciones de las tareas.');
  const findingsById = new Map(findings.map((finding) => [finding.id, finding]));
  const findingNames = new Map(
    findings.map((finding) => [finding.id, `${findingCode(finding.code)} · ${finding.title}`]),
  );
  const assessmentNames = new Map(assessments.map((assessment) => [assessment.id, assessment.name]));
  return (
    <>
      <div>
        <h1 className="page-title">
          {scope ? `Tareas ${scope.organization.legal_name}` : 'Tareas'}
        </h1>
        <p className="muted mt-2">
          Acciones asignadas y revisión del consultor.
          {profile.role === 'CLIENT' && ' Solo se muestran tareas asignadas a usted.'}
        </p>
      </div>
      {scope && <WorkflowNav org={scope.organization.id} />}
      <form className="flex flex-wrap items-end gap-3">
        {params.finding && <input type="hidden" name="finding" value={params.finding} />}
        <label className="form-label flex-1 min-w-40">
          Buscar
          <input className="field" name="q" defaultValue={params.q} />
        </label>
        <label className="form-label">
          Organización
          <select
            className="field max-w-64"
            name="organization"
            defaultValue={params.organization || ''}
          >
            <option value="">Todas</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.legal_name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Estado
          <select className="field" name="status" defaultValue={params.status || ''}>
            <option value="">Todos</option>
            {Object.entries(taskLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Prioridad
          <select className="field" name="priority" defaultValue={params.priority || ''}>
            <option value="">Todas</option>
            {Object.entries(severityLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {
          <label className="form-label">
            Responsable
            <select className="field" name="assigned" defaultValue={params.assigned || ''}>
              <option value="">Todos</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.id}
                </option>
              ))}
            </select>
          </label>
        }
        <label className="form-label">
          Orden
          <select className="field" name="sort" defaultValue={sort}>
            <option value="updated_at">Última actualización</option>
            <option value="title">Título</option>
            <option value="due_date">Fecha objetivo</option>
          </select>
        </label>
        <label className="flex gap-2 text-sm">
          <input name="mine" type="checkbox" value="yes" defaultChecked={params.mine === 'yes'} />
          Mis tareas
        </label>
        <label className="flex gap-2 text-sm">
          <input
            name="overdue"
            type="checkbox"
            value="yes"
            defaultChecked={params.overdue === 'yes'}
          />
          Vencidas
        </label>
        <Button variant="outline">Filtrar</Button>
        <Link
          className="text-sm underline"
          href={scope ? `/tasks?organization=${scope.organization.id}` : '/tasks'}
        >
          Limpiar filtros
        </Link>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Organización</th>
              <th>Evaluación</th>
              <th>Hallazgo</th>
              <th>Prioridad</th>
              <th>Responsable</th>
              <th>Fecha objetivo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id}>
                <td className="min-w-48 max-w-sm break-words">
                  <Link
                    className="font-semibold text-teal-800 hover:underline"
                    href={`/tasks/${t.id}`}
                  >
                    {t.title}
                  </Link>
                </td>
                <td className="min-w-36">
                  {orgs.find((o) => o.id === t.organization_id)?.legal_name}
                </td>
                <td className="min-w-48 max-w-sm break-words">
                  {assessmentNames.get(findingsById.get(t.finding_id)?.assessment_id || '') ||
                    'Evaluación no disponible'}
                </td>
                <td className="min-w-48 max-w-sm break-words">
                  {findingNames.get(t.finding_id) || 'Hallazgo no disponible'}
                </td>
                <td>{severityLabels[t.priority]}</td>
                <td>
                  {t.assigned_to === profile.id
                    ? 'Usted'
                    : t.assigned_to
                      ? members.find((m) => m.id === t.assigned_to)?.full_name || 'Miembro asignado'
                      : 'Sin asignar'}
                </td>
                <td className="whitespace-nowrap">{calendarDate(t.due_date)}</td>
                <td>
                  <span className="badge">{taskLabels[t.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && <p className="empty">No se encontraron tareas.</p>}
      </div>
      <Pagination page={page} count={count || 0} path="/tasks" params={params} />
    </>
  );
}
