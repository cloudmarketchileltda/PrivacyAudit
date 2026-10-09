import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { ActionForm, Field } from '@/components/forms';
import { createReport } from '@/features/reports/actions';
import { generalConfig } from '@/config/general';
import { z } from '@/lib/validation';
import { assessmentLabels } from '@/features/assessments/model';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ assessment?: string }>;
}) {
  const { assessment } = await searchParams;
  if (!z.uuid().safeParse(assessment).success) notFound();
  const { db } = await requireUser();
  const { data: a, error } = await db
    .from('assessments')
    .select('*')
    .eq('id', assessment!)
    .single();
  if (error || !a) notFound();
  const { data: manager } = await db.rpc('can_manage_organization', { org: a.organization_id });
  if (!manager) notFound();
  const { data: o } = await db
    .from('organizations')
    .select('legal_name,status')
    .eq('id', a.organization_id)
    .single();
  if (!o || o.status !== 'ACTIVE') notFound();
  return (
    <>
      <div>
        <Link href={`/assessments/${a.id}`} className="muted underline">
          Volver a evaluación
        </Link>
        <h1 className="page-title mt-2">Publicar informe PDF</h1>
        <p className="muted mt-2">
          {o.legal_name} · {a.name} · {assessmentLabels[a.status]}
        </p>
      </div>
      <section className="panel max-w-3xl">
        <p className="muted mb-5">
          Publicar comparte un informe completo con todos los miembros actuales de esta
          organización. Incluye todas las tareas de la evaluación, sus responsables y evidencias
          revisadas, además del registro de tratamientos. Revise el contenido antes de publicar. El
          informe conserva los datos al momento de la publicación y no se puede editar; para
          corregirlo publique otro informe.
        </p>
        {a.status !== 'COMPLETED' && (
          <p className="mb-5 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            La evaluación aún no está completada. El informe identificará su estado y los controles
            pendientes.
          </p>
        )}
        <ActionForm action={createReport} label="Publicar informe" variant="default">
          <input type="hidden" name="assessment" value={a.id} />
          <Field
            name="report_title"
            label="Título del informe"
            defaultValue={`Diagnóstico - ${a.name}`.slice(0, generalConfig.reports.titleMaxLength)}
            maxLength={generalConfig.reports.titleMaxLength}
            required
          />
          {(
            [
              ['executive_summary', 'Resumen ejecutivo'],
              ['report_scope', 'Alcance'],
              ['conclusions', 'Conclusiones'],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="form-label">
              {label}
              <textarea
                name={name}
                aria-label={label}
                className="field"
                rows={6}
                required
                minLength={generalConfig.reports.textMinLength}
                maxLength={generalConfig.reports.textMaxLength}
                defaultValue={name === 'report_scope' ? a.description : undefined}
              />
              <span className="muted">
                Entre {generalConfig.reports.textMinLength} y {generalConfig.reports.textMaxLength}{' '}
                caracteres. Redacción del profesional; sin conclusiones jurídicas automáticas.
              </span>
            </label>
          ))}
        </ActionForm>
      </section>
    </>
  );
}
