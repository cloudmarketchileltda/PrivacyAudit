import Link from 'next/link';
import { ArrowUpRight, Building2, ClipboardList, ListChecks, Clock3 } from 'lucide-react';
import { requireUser } from '@/features/auth/queries';
import { allAssessments, allResponses } from '@/features/assessments/queries';
import { evaluationMetrics, assessmentLabels } from '@/features/assessments/model';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import type { Organization } from '@/types/domain';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const { db, profile } = await requireUser();
  let query = db.from('organizations').select('*', { count: 'exact' }).order('legal_name');
  if (searchTerm(params.q)) query = query.ilike('legal_name', `%${searchTerm(params.q)}%`);
  const [
    { data: organizations, count, error },
    assessments,
    responses,
    { count: activeCount, error: countError },
  ] = await Promise.all([
    query.range((page - 1) * 20, page * 20 - 1),
    allAssessments(db),
    allResponses(db),
    db.from('organizations').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
  ]);
  if (error || countError) throw error || countError;
  const metrics = evaluationMetrics(responses);
  const inProgress = assessments.filter(
    (a) => a.status === 'IN_PROGRESS' || a.status === 'REVIEW',
  ).length;
  const indicators = [
    ['Organizaciones activas', activeCount || 0, Building2],
    ['Evaluaciones en progreso', inProgress, ClipboardList],
    ['Controles evaluados', metrics.evaluated, ListChecks],
    ['Controles pendientes', metrics.counts.PENDING, Clock3],
  ] as const;
  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="muted mb-1">Su espacio de trabajo</p>
          <h1 className="page-title">Dashboard de evaluación</h1>
          <p className="muted mt-2">Estado de las organizaciones y sus evaluaciones.</p>
        </div>
        {profile.role !== 'CLIENT' && (
          <Button asChild>
            <Link href="/assessments/new">
              Nueva evaluación
              <ArrowUpRight size={16} />
            </Link>
          </Button>
        )}
      </div>
      <section
        className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5"
        aria-label="Indicadores de evaluación"
      >
        {indicators.map(([label, value, Icon]) => (
          <div key={label} className="panel p-4 md:p-5">
            <div className="flex justify-between gap-2">
              <p className="text-xs md:text-sm text-slate-500">{label}</p>
              <Icon size={17} className="text-teal-700 shrink-0" />
            </div>
            <p className="text-3xl font-semibold mt-4">{value}</p>
          </div>
        ))}
      </section>
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <h2 className="section-title mb-0">Organizaciones y última evaluación</h2>
          <form className="flex gap-2 items-end">
            <label className="form-label">
              Buscar
              <input
                name="q"
                defaultValue={params.q}
                className="field"
                placeholder="Organización"
              />
            </label>
            <Button variant="outline">Buscar</Button>
          </form>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organización</th>
                <th>Última evaluación</th>
                <th>Estado</th>
                <th>Avance de evaluación</th>
                <th>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {(organizations as Organization[])?.map((org) => {
                const latest = assessments
                  .filter((a) => a.organization_id === org.id)
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
                const m = evaluationMetrics(
                  responses.filter((r) => r.assessment_id === latest?.id),
                );
                return (
                  <tr key={org.id}>
                    <td>
                      <Link
                        href={`/organizations/${org.id}`}
                        className="font-semibold text-teal-800 hover:underline"
                      >
                        {org.legal_name}
                      </Link>
                      <p className="muted">{org.rut}</p>
                    </td>
                    <td>
                      {latest ? (
                        <Link className="hover:underline" href={`/assessments/${latest.id}`}>
                          {latest.name}
                        </Link>
                      ) : (
                        'Sin evaluación'
                      )}
                    </td>
                    <td>
                      <span className="badge">
                        {latest
                          ? assessmentLabels[latest.status]
                          : org.status === 'ACTIVE'
                            ? 'Activa'
                            : 'Archivada'}
                      </span>
                    </td>
                    <td className="min-w-44">
                      {latest ? (
                        <>
                          <div className="flex justify-between text-xs mb-2">
                            <span>
                              {m.evaluated}/{m.total} controles
                            </span>
                            <strong>{m.progress}%</strong>
                          </div>
                          <progress
                            className="w-full h-1.5 accent-teal-800"
                            max={100}
                            value={m.progress}
                            aria-label={`Avance ${org.legal_name}`}
                          />
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      {formatDate(latest?.updated_at || org.updated_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!organizations?.length && (
            <div className="empty">
              <p>Sin organizaciones para mostrar.</p>
              {profile.role !== 'CLIENT' && (
                <Link className="text-teal-800 underline block mt-3" href="/organizations/new">
                  Crear primera organización
                </Link>
              )}
              {profile.role === 'CLIENT' && (
                <p className="mt-3">Abra su enlace de invitación para vincularse a una empresa.</p>
              )}
            </div>
          )}
        </div>
        <div className="mt-4">
          <Pagination page={page} count={count || 0} path="/dashboard" params={params} />
        </div>
      </section>
      <p className="muted">
        El avance mide el trabajo de evaluación registrado. Las conclusiones sobre cumplimiento
        requieren análisis jurídico y profesional.
      </p>
    </>
  );
}
