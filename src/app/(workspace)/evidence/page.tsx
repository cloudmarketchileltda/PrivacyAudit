import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { organizationScope } from '@/features/workflow/queries';
import { WorkflowNav } from '@/features/workflow/nav';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import { Button } from '@/components/ui/button';
import { reviewLabels } from '@/features/evidence/schemas';
import { formatDate } from '@/lib/utils';
import { z } from '@/lib/validation';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const { db } = await requireUser();
  const scope = p.organization ? await organizationScope(p.organization) : null;
  const page = pageNumber(p.page);
  const term = searchTerm(p.q);
  let query = db.from('evidence').select('*', { count: 'exact' });
  for (const [param, column] of [
    ['organization', 'organization_id'],
    ['control', 'control_id'],
    ['finding', 'finding_id'],
    ['task', 'task_id'],
  ] as const) {
    if (p[param]) {
      if (!z.uuid().safeParse(p[param]).success) notFound();
      query = query.eq(column, p[param]!);
    }
  }
  if (p.status && p.status in reviewLabels)
    query = query
      .eq('review_status', p.status as keyof typeof reviewLabels)
      .not('uploaded_at', 'is', null);
  if (p.status === 'INCOMPLETE') query = query.is('uploaded_at', null);
  if (term) query = query.or(`original_filename.ilike.%${term}%,description.ilike.%${term}%`);
  const sort = p.sort === 'name' ? 'original_filename' : 'created_at';
  const { data, error, count } = await query
    .order(sort, { ascending: sort === 'original_filename' || p.sort === 'oldest' })
    .order('id')
    .range((page - 1) * 20, page * 20 - 1);
  if (error) throw new Error('No se pudieron cargar las evidencias.');
  const orgIds = [...new Set(data.map((e) => e.organization_id))];
  const { data: orgs, error: orgError } = orgIds.length
    ? await db.from('organizations').select('id,legal_name').in('id', orgIds)
    : { data: [], error: null };
  if (orgError) throw new Error('No se pudieron cargar las organizaciones.');
  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="page-title">Evidencias</h1>
          <p className="muted mt-2">
            {scope?.organization.legal_name ||
              'Archivos y revisión de las organizaciones a las que tiene acceso.'}
          </p>
        </div>
        {(!scope || scope.organization.status === 'ACTIVE') && (
          <Button asChild>
            <Link href={`/evidence/new${p.organization ? `?organization=${p.organization}` : ''}`}>
              Nueva evidencia
            </Link>
          </Button>
        )}
      </div>
      {scope && <WorkflowNav org={scope.organization.id} />}
      <form className="panel grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(['organization', 'control', 'finding', 'task'] as const).map(
          (k) => p[k] && <input key={k} type="hidden" name={k} value={p[k]} />,
        )}
        <label className="form-label">
          Buscar
          <input
            className="field"
            name="q"
            defaultValue={p.q}
            maxLength={100}
            placeholder="Archivo o descripción"
          />
        </label>
        <label className="form-label">
          Estado
          <select aria-label="Estado" className="field" name="status" defaultValue={p.status || ''}>
            <option value="">Todos</option>
            {Object.entries(reviewLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
            <option value="INCOMPLETE">Carga incompleta</option>
          </select>
        </label>
        <label className="form-label">
          Orden
          <select aria-label="Orden" className="field" name="sort" defaultValue={p.sort || ''}>
            <option value="">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="name">Nombre del archivo</option>
          </select>
        </label>
        <Button className="self-end">Filtrar</Button>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Organización</th>
              <th>Estado</th>
              <th>Entrega</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id}>
                <td className="min-w-48 max-w-sm break-words">
                  <Link
                    className="font-semibold text-teal-800 hover:underline"
                    href={`/evidence/${e.id}`}
                  >
                    {e.original_filename}
                  </Link>
                  <p className="muted line-clamp-2 mt-1">{e.description}</p>
                </td>
                <td>
                  {orgs?.find((o) => o.id === e.organization_id)?.legal_name || 'Organización'}
                </td>
                <td>
                  <span className="badge">
                    {e.uploaded_at ? reviewLabels[e.review_status] : 'Carga incompleta'}
                  </span>
                </td>
                <td>{e.previous_evidence_id ? 'Corrección' : 'Inicial'}</td>
                <td>{formatDate(e.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && <p className="empty">No hay evidencias para estos filtros.</p>}
      </div>
      <Pagination page={page} count={count || 0} path="/evidence" params={p} />
    </>
  );
}
