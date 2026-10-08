import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { assessmentLabels, controlLabels, controlStatuses } from '@/features/assessments/model';
import { Button } from '@/components/ui/button';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import { formatDate } from '@/lib/utils';
interface Summary {
  total: number;
  rows: {
    id: string;
    legal_name: string;
    rut: string;
    status: string;
    assessment_id: string | null;
    assessment_name: string | null;
    assessment_status: keyof typeof assessmentLabels | null;
    total_controls: number;
    evaluated_controls: number;
    open_findings: number;
    high_findings: number;
    overdue_tasks: number;
    last_activity: string;
  }[];
  metrics: Record<string, number>;
  control_counts: Record<string, number>;
  severity_counts: Record<string, number>;
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const { db, profile } = await requireUser();
  const { data, error } = await db.rpc('dashboard_summary', {
    search: searchTerm(params.q),
    org_status: ['ACTIVE', 'ARCHIVED'].includes(params.status || '') ? params.status : '',
    attention: ['high', 'overdue', 'evidence'].includes(params.attention || '')
      ? params.attention
      : '',
    page,
  });
  if (error) throw error;
  const s = data as unknown as Summary;
  const m = s.metrics;
  const indicators = [
    ['Organizaciones activas', m.active_organizations],
    ['Evaluaciones en progreso', m.assessments_in_progress],
    ['Hallazgos abiertos', m.open_findings],
    ['Hallazgos de alta prioridad', m.high_findings],
    ['Tareas vencidas', m.overdue_tasks],
    ['Evidencias pendientes de revisión', m.pending_evidence],
    ['Controles evaluados', m.evaluated],
    ['Controles pendientes', s.control_counts.PENDING || 0],
    ['Hallazgos cerrados', m.closed_findings],
    ['Riesgos aceptados', m.accepted_risk],
    ['Evidencias aceptadas', m.accepted_evidence],
  ] as const;
  const progress = m.controls_total ? Math.round((m.evaluated / m.controls_total) * 100) : 0;
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="muted mb-1">Su espacio de trabajo</p>
          <h1 className="page-title">Dashboard de evaluación</h1>
          <p className="muted mt-2">
            Evaluaciones, hallazgos, tareas y evidencias de las organizaciones accesibles.
          </p>
        </div>
        {profile.role !== 'CLIENT' && (
          <Button asChild>
            <Link href="/assessments/new">Nueva evaluación</Link>
          </Button>
        )}
      </div>
      <form className="panel p-4 flex flex-wrap gap-3 items-end">
        <label className="form-label">
          Buscar
          <input name="q" defaultValue={params.q} className="field" placeholder="Organización" />
        </label>
        <label className="form-label">
          Estado de organización
          <select name="status" defaultValue={params.status || ''} className="field">
            <option value="">Todos</option>
            <option value="ACTIVE">Activa</option>
            <option value="ARCHIVED">Archivada</option>
          </select>
        </label>
        <label className="form-label">
          Requiere atención
          <select name="attention" defaultValue={params.attention || ''} className="field">
            <option value="">Todas</option>
            <option value="high">Hallazgos de alta prioridad</option>
            <option value="overdue">Tareas vencidas</option>
            <option value="evidence">Evidencias pendientes</option>
          </select>
        </label>
        <Button variant="outline">Buscar</Button>
        <Link href="/dashboard" className="underline text-sm">
          Limpiar
        </Link>
      </form>
      <section
        className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5"
        aria-label="Indicadores de evaluación"
      >
        {indicators.map(([label, value]) => (
          <div className="panel p-4 md:p-5" key={label}>
            <p className="text-xs md:text-sm text-slate-500">{label}</p>
            <p className="text-3xl font-semibold mt-4">{value}</p>
          </div>
        ))}
      </section>
      <div className="grid md:grid-cols-2 gap-5">
        <section className="panel p-5">
          <h2 className="section-title">Controles de la última evaluación por organización</h2>
          <p className="text-xl font-semibold">
            {progress}% evaluados · {m.evaluated}/{m.controls_total}
          </p>
          <progress
            className="w-full accent-teal-800 mt-3"
            max={100}
            value={progress}
            aria-label="Porcentaje de controles evaluados"
          />
          <dl className="grid grid-cols-2 gap-3 mt-4">
            {controlStatuses.map((status) => (
              <div key={status}>
                <dt className="muted">{controlLabels[status]}</dt>
                <dd className="font-semibold">{s.control_counts[status] || 0}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="panel p-5">
          <h2 className="section-title">Severidad de hallazgos abiertos</h2>
          <dl className="space-y-3">
            {[
              ['CRITICAL', 'Crítica'],
              ['HIGH', 'Alta'],
              ['MEDIUM', 'Media'],
              ['LOW', 'Baja'],
            ].map(([v, label]) => (
              <div key={v} className="flex justify-between border-b pb-2">
                <dt>{label}</dt>
                <dd className="font-semibold">{s.severity_counts[v] || 0}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <section>
        <h2 className="section-title">Organizaciones y última evaluación</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Organización</th>
                <th>Última evaluación</th>
                <th>Estado</th>
                <th>Avance de evaluación</th>
                <th>Hallazgos abiertos</th>
                <th>Alta prioridad</th>
                <th>Tareas vencidas</th>
                <th>Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link
                      className="font-semibold text-teal-800 hover:underline"
                      href={`/assessments?organization=${o.id}`}
                    >
                      {o.legal_name}
                    </Link>
                    <p className="muted">{o.rut}</p>
                  </td>
                  <td>
                    {o.assessment_id ? (
                      <Link className="hover:underline" href={`/assessments/${o.assessment_id}`}>
                        {o.assessment_name}
                      </Link>
                    ) : (
                      'Sin evaluación'
                    )}
                  </td>
                  <td>
                    <span className="badge">
                      {o.assessment_status
                        ? assessmentLabels[o.assessment_status]
                        : o.status === 'ACTIVE'
                          ? 'Activa'
                          : 'Archivada'}
                    </span>
                  </td>
                  <td className="min-w-44">
                    {o.assessment_id ? (
                      <>
                        <div className="flex justify-between text-xs mb-2">
                          <span>
                            {o.evaluated_controls}/{o.total_controls} controles
                          </span>
                          <strong>
                            {o.total_controls
                              ? Math.round((o.evaluated_controls / o.total_controls) * 100)
                              : 0}
                            %
                          </strong>
                        </div>
                        <progress
                          className="w-full h-1.5 accent-teal-800"
                          max={Math.max(o.total_controls, 1)}
                          value={o.evaluated_controls}
                          aria-label={`Avance ${o.legal_name}`}
                        />
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{o.open_findings}</td>
                  <td>{o.high_findings}</td>
                  <td>{o.overdue_tasks}</td>
                  <td className="whitespace-nowrap">{formatDate(o.last_activity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!s.rows.length && (
            <div className="empty">
              <p>Sin organizaciones para mostrar.</p>
              <p className="mt-3">
                {profile.role === 'SUPER_ADMIN'
                  ? 'Agregue organizaciones desde Administración.'
                  : 'Solicite al administrador la asignación de una organización.'}
              </p>
            </div>
          )}
        </div>
        <div className="mt-4">
          <Pagination page={page} count={s.total} path="/dashboard" params={params} />
        </div>
      </section>
      <p className="muted">
        Los filtros afectan las métricas y la tabla. Los controles se cuentan sobre la última
        evaluación de cada organización; las evaluaciones en progreso incluyen todas las activas. El
        cliente ve únicamente sus tareas asignadas. Evidencias pendientes y aceptadas consideran la
        última entrega confirmada de cada cadena.
      </p>
      <p className="muted">
        El avance mide el trabajo de evaluación registrado. Las conclusiones sobre cumplimiento
        requieren análisis jurídico y profesional.
      </p>
    </>
  );
}
