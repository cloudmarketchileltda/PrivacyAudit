import { pageRange } from '@/config/general';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import { ActionForm, Field } from '@/components/forms';
import { updateAssessment } from '@/features/assessments/actions';
import { allResponses } from '@/features/assessments/queries';
import {
  controlLabels,
  controlStatuses,
  assessmentLabels,
  evaluationMetrics,
  type Assessment,
} from '@/features/assessments/model';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const filters = await searchParams;
  const page = pageNumber(filters.page);
  const { db } = await requireUser();
  const { data, error } = await db.from('assessments').select('*').eq('id', id).single();
  if (error || !data) notFound();
  const assessment = data as Assessment;
  const [{ data: org }, { data: manager }, responses] = await Promise.all([
    db.from('organizations').select('legal_name').eq('id', assessment.organization_id).single(),
    db.rpc('can_manage_organization', { org: assessment.organization_id }),
    allResponses(db, id),
  ]);
  const metrics = evaluationMetrics(responses);
  const categories = [...new Set(responses.map((r) => r.snapshot.category))].sort();
  const q = searchTerm(filters.q).toLowerCase();
  const filtered = responses
    .filter(
      (r) =>
        (!q || `${r.snapshot.code} ${r.snapshot.title}`.toLowerCase().includes(q)) &&
        (!filters.category || r.snapshot.category === filters.category) &&
        (!filters.status || r.status === filters.status),
    )
    .sort((a, b) =>
      filters.sort === 'title'
        ? a.snapshot.title.localeCompare(b.snapshot.title, 'es')
        : a.snapshot.sort_order - b.snapshot.sort_order,
    );
  return (
    <>
      <div>
        <Link className="muted underline" href={`/assessments?organization=${assessment.organization_id}`}>
          {org?.legal_name}
        </Link>
        <h1 className="page-title mt-2 break-words">{assessment.name}</h1>
        <p className="muted mt-2">
          {assessmentLabels[assessment.status]} ·{' '}
          {assessment.description || 'Sin descripción de alcance'}
        </p>
      </div>
      <section className="panel">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div>
            <h2 className="section-title">Avance de evaluación</h2>
            <p className="text-4xl font-semibold">{metrics.progress}%</p>
            <p className="muted mt-2">
              {metrics.evaluated} de {metrics.total} controles evaluados
            </p>
          </div>
          <div className="flex flex-wrap gap-5">
            {controlStatuses.map((s) => (
              <div key={s}>
                <p className="text-xl font-semibold">{metrics.counts[s]}</p>
                <p className="muted">{controlLabels[s]}</p>
              </div>
            ))}
          </div>
        </div>
        <progress
          className="w-full h-2 accent-teal-800 mt-6"
          max={100}
          value={metrics.progress}
          aria-label="Avance de evaluación"
        />
        <p className="muted mt-3">
          El avance representa controles evaluados, incluyendo los que no aplican con justificación.
          Requiere interpretación profesional.
        </p>
      </section>
      {manager && (
        <details className="panel">
          <summary className="font-semibold text-sm cursor-pointer">
            Editar nombre, alcance y estado de la evaluación
          </summary>
          <div className="mt-5 max-w-2xl">
            <ActionForm action={updateAssessment}>
              <input type="hidden" name="id" value={id} />
              <Field name="name" label="Nombre" defaultValue={assessment.name} required />
              <label className="form-label">
                Alcance
                <textarea
                  name="description"
                  className="field"
                  defaultValue={assessment.description}
                  rows={3}
                />
              </label>
              <label className="form-label">
                Estado
                <select name="status" className="field" defaultValue={assessment.status}>
                  {Object.entries(assessmentLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted">
                Completar requiere evaluar todos los controles. Reabrir permite corregir respuestas.
              </p>
            </ActionForm>
          </div>
        </details>
      )}
      <form className="flex flex-wrap gap-3 items-end">
        <label className="form-label flex-1 min-w-40">
          Buscar
          <input
            name="q"
            className="field"
            defaultValue={filters.q}
            placeholder="Código o título"
          />
        </label>
        <label className="form-label">
          Categoría
          <select name="category" className="field max-w-64" defaultValue={filters.category || ''}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Estado
          <select name="status" className="field" defaultValue={filters.status || ''}>
            <option value="">Todos</option>
            {controlStatuses.map((s) => (
              <option key={s} value={s}>
                {controlLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Orden
          <select name="sort" className="field" defaultValue={filters.sort || 'code'}>
            <option value="code">Código</option>
            <option value="title">Título</option>
          </select>
        </label>
        <Button variant="outline">Filtrar</Button>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Control</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Revisión jurídica</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(pageRange(page)[0], pageRange(page)[1] + 1).map((r) => (
              <tr key={r.id}>
                <td className="font-mono whitespace-nowrap">{r.snapshot.code}</td>
                <td>
                  <Link
                    className="text-teal-800 font-semibold hover:underline"
                    href={`/assessments/${id}/controls/${r.id}`}
                  >
                    {r.snapshot.title}
                  </Link>
                </td>
                <td>{r.snapshot.category}</td>
                <td>
                  <span className="badge">{controlLabels[r.status]}</span>
                </td>
                <td className="text-xs text-slate-500">
                  {r.snapshot.legal_review_status === 'PENDING' ? 'Pendiente' : 'Revisada'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="empty">No hay controles con estos filtros.</p>}
      </div>
      <Pagination
        page={page}
        count={filtered.length}
        path={`/assessments/${id}`}
        params={filters}
      />
      <section className="panel">
        <h2 className="section-title">Resultados por categoría</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Evaluados</th>
                <th>Total</th>
                <th>Avance</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const m = evaluationMetrics(
                  responses.filter((r) => r.snapshot.category === category),
                );
                return (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{m.evaluated}</td>
                    <td>{m.total}</td>
                    <td>{m.progress}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
