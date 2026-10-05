import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import { assessmentLabels, evaluationMetrics, type Assessment } from '@/features/assessments/model';
import { allResponses } from '@/features/assessments/queries';
import { formatDate } from '@/lib/utils';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const { db, profile } = await requireUser();
  let query = db
    .from('assessments')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  const q = searchTerm(params.q);
  if (q) query = query.ilike('name', `%${q}%`);
  if (params.status && params.status in assessmentLabels)
    query = query.eq('status', params.status as keyof typeof assessmentLabels);
  if (params.organization) query = query.eq('organization_id', params.organization);
  const [{ data, count, error }, { data: organizations, error: orgError }, responses] =
    await Promise.all([
      query.range((page - 1) * 20, page * 20 - 1),
      db.from('organizations').select('id,legal_name').order('legal_name'),
      allResponses(db),
    ]);
  if (error || orgError) throw error || orgError;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Evaluaciones</h1>
          <p className="muted mt-2">Historial y avance de evaluación por organización.</p>
        </div>
        {profile.role !== 'CLIENT' && (
          <Button asChild>
            <Link href="/assessments/new">Nueva evaluación</Link>
          </Button>
        )}
      </div>
      <form className="flex flex-wrap items-end gap-3">
        <label className="form-label flex-1 min-w-40">
          Buscar
          <input
            name="q"
            className="field"
            defaultValue={params.q}
            placeholder="Nombre de evaluación"
          />
        </label>
        <label className="form-label">
          Organización
          <select
            name="organization"
            className="field max-w-64"
            defaultValue={params.organization || ''}
          >
            <option value="">Todas</option>
            {organizations?.map((org) => (
              <option key={org.id} value={org.id}>
                {org.legal_name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Estado
          <select name="status" className="field" defaultValue={params.status || ''}>
            <option value="">Todos</option>
            {Object.entries(assessmentLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline">Filtrar</Button>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Evaluación</th>
              <th>Organización</th>
              <th>Estado</th>
              <th>Avance de evaluación</th>
              <th>Creación</th>
            </tr>
          </thead>
          <tbody>
            {(data as Assessment[])?.map((assessment) => {
              const metrics = evaluationMetrics(
                responses.filter((r) => r.assessment_id === assessment.id),
              );
              return (
                <tr key={assessment.id}>
                  <td>
                    <Link
                      className="text-teal-800 font-semibold hover:underline"
                      href={`/assessments/${assessment.id}`}
                    >
                      {assessment.name}
                    </Link>
                  </td>
                  <td>
                    {organizations?.find((o) => o.id === assessment.organization_id)?.legal_name}
                  </td>
                  <td>
                    <span className="badge">{assessmentLabels[assessment.status]}</span>
                  </td>
                  <td>
                    {metrics.progress}%{' '}
                    <span className="muted">
                      · {metrics.evaluated}/{metrics.total}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(assessment.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data?.length && <p className="empty">No se encontraron evaluaciones.</p>}
      </div>
      <Pagination page={page} count={count || 0} path="/assessments" params={params} />
    </>
  );
}
