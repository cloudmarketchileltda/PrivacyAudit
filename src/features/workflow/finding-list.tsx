import { calendarDate } from '@/features/workflow/schemas';
import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import { z } from '@/lib/validation';
import { findingLabels, severityLabels, findingCode } from './schemas';
import { organizationScope, assignees } from './queries';
import { WorkflowNav } from './nav';
export async function FindingList({
  params,
  plan = false,
}: {
  params: Record<string, string | undefined>;
  plan?: boolean;
}) {
  const scope = params.organization ? await organizationScope(params.organization) : null;
  const { db, profile } = scope || (await requireUser());
  const page = pageNumber(params.page),
    q = searchTerm(params.q),
    path = plan ? '/action-plan' : '/findings';
  let query = db.from('findings').select('*', { count: 'exact' });
  if (scope) query = query.eq('organization_id', scope.organization.id);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  if (params.status && Object.hasOwn(findingLabels, params.status))
    query = query.eq('status', params.status as keyof typeof findingLabels);
  if (params.severity && Object.hasOwn(severityLabels, params.severity))
    query = query.eq('severity', params.severity as keyof typeof severityLabels);
  if (params.open === 'yes') query = query.not('status', 'in', '(CLOSED,ACCEPTED_RISK)');
  if (params.overdue === 'yes')
    query = query
      .lt('due_date', new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' }))
      .not('status', 'in', '(CLOSED,ACCEPTED_RISK)');
  if (params.high === 'yes') query = query.in('severity', ['HIGH', 'CRITICAL']);
  if (z.uuid().safeParse(params.assigned).success)
    query = query.eq('assigned_to', params.assigned!);
  const area = searchTerm(params.area);
  if (area) query = query.ilike('area', `%${area}%`);
  const sort =
    params.sort === 'due_date' ? 'due_date' : params.sort === 'title' ? 'title' : 'updated_at';
  query = query.order(sort, { ascending: sort !== 'updated_at', nullsFirst: false }).order('id');
  const [{ data, count, error }, { data: orgs, error: orgError }, members] = await Promise.all([
    query.range((page - 1) * 20, page * 20 - 1),
    db.from('organizations').select('id,legal_name').order('legal_name'),
    assignees(scope?.organization.id),
  ]);
  if (error || orgError) throw new Error('No se pudieron cargar los hallazgos.');
  const rows = await Promise.all(
    data.map(async (row) => {
      const { data: progress, error } = await db.rpc('finding_progress', { finding: row.id });
      if (error) throw new Error('No se pudo calcular el progreso.');
      const values = progress as { total: number; done: number };
      return { ...row, progress: values };
    }),
  );
  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          {scope && <p className="muted">{scope.organization.legal_name}</p>}
          <h1 className="page-title">{plan ? 'Plan de acción' : 'Hallazgos'}</h1>
          <p className="muted mt-2">
            {plan
              ? 'Acciones correctivas y progreso de tareas aprobadas.'
              : 'Brechas identificadas y recomendaciones del consultor.'}
          </p>
        </div>
        {scope?.canEdit ? (
          <Button asChild>
            <Link href={`/organizations/${scope.organization.id}/findings/new`}>
              Nuevo hallazgo
            </Link>
          </Button>
        ) : !scope && profile.role !== 'CLIENT' ? (
          <Button asChild variant="outline">
            <Link href="/organizations">Elegir organización</Link>
          </Button>
        ) : null}
      </div>
      {scope && <WorkflowNav org={scope.organization.id} />}
      <form className="flex flex-wrap items-end gap-3">
        <label className="form-label flex-1 min-w-40">
          Buscar
          <input
            className="field"
            name="q"
            defaultValue={params.q}
            placeholder="Título o descripción"
          />
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
            {Object.entries(findingLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Severidad
          <select className="field" name="severity" defaultValue={params.severity || ''}>
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
          Área
          <input className="field" name="area" defaultValue={params.area} />
        </label>
        <label className="form-label">
          Orden
          <select className="field" name="sort" defaultValue={sort}>
            <option value="updated_at">Última actualización</option>
            <option value="title">Título</option>
            <option value="due_date">Fecha objetivo</option>
          </select>
        </label>
        {['open', 'overdue', 'high'].map((name, i) => (
          <label key={name} className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              name={name}
              value="yes"
              defaultChecked={params[name] === 'yes'}
            />
            {['Abiertos', 'Vencidos', 'Alta prioridad'][i]}
          </label>
        ))}
        <Button variant="outline">Filtrar</Button>
        <Link
          className="text-sm underline"
          href={scope ? `${path}?organization=${scope.organization.id}` : path}
        >
          Limpiar filtros
        </Link>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hallazgo</th>
              <th>Organización</th>
              <th>Severidad</th>
              <th>Responsable</th>
              <th>Fecha objetivo</th>
              <th>Estado</th>
              <th>Progreso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="min-w-48 max-w-sm break-words">
                  <Link
                    className="font-semibold text-teal-800 hover:underline"
                    href={`/findings/${row.id}`}
                  >
                    {findingCode(row.code)} · {row.title}
                  </Link>
                  <p className="muted">{row.area}</p>
                </td>
                <td className="min-w-36">
                  {orgs.find((o) => o.id === row.organization_id)?.legal_name}
                </td>
                <td>{severityLabels[row.severity]}</td>
                <td className="max-w-48 break-words">
                  {row.assigned_to
                    ? members.find((m) => m.id === row.assigned_to)?.full_name || 'Miembro asignado'
                    : 'Sin asignar'}
                </td>
                <td className="whitespace-nowrap">{calendarDate(row.due_date)}</td>
                <td>
                  <span className="badge">{findingLabels[row.status]}</span>
                </td>
                <td className="whitespace-nowrap">
                  {row.progress.done}/{row.progress.total} aprobadas
                  {row.progress.total > 0
                    ? ` · ${Math.round((row.progress.done * 100) / row.progress.total)}%`
                    : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="empty">No se encontraron hallazgos.</p>}
      </div>
      <Pagination page={page} count={count || 0} path={path} params={params} />
    </>
  );
}
