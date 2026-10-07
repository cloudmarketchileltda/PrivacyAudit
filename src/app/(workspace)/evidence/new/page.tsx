import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { organizationScope, findingScope, taskScope } from '@/features/workflow/queries';
import { WorkflowNav } from '@/features/workflow/nav';
import { UploadForm } from '@/features/evidence/upload-form';
import { Button } from '@/components/ui/button';
import { z } from '@/lib/validation';
import type { UploadContext } from '@/features/evidence/schemas';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const { db } = await requireUser();
  if (!p.organization && !p.previous) {
    const { data, error } = await db
      .from('organizations')
      .select('id,legal_name')
      .eq('status', 'ACTIVE')
      .order('legal_name');
    if (error) throw new Error('No se pudieron cargar las organizaciones.');
    return (
      <>
        <h1 className="page-title">Nueva evidencia</h1>
        <section className="panel">
          <form className="space-y-4">
            <label className="form-label">
              Organización
              <select aria-label="Organización" name="organization" required className="field">
                <option value="">Seleccione una organización</option>
                {data.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.legal_name}
                  </option>
                ))}
              </select>
            </label>
            <Button>Continuar</Button>
          </form>
          {!data.length && (
            <p className="muted mt-4">No tiene organizaciones activas disponibles.</p>
          )}
        </section>
      </>
    );
  }
  let context: UploadContext = {
    organization_id: p.organization || '',
    control_id: p.control,
    finding_id: p.finding,
    task_id: p.task,
  };
  let description = '';
  if (p.previous) {
    if (!z.uuid().safeParse(p.previous).success) notFound();
    const { data: e, error } = await db
      .from('evidence')
      .select('*')
      .eq('id', p.previous)
      .maybeSingle();
    if (error) throw new Error('No se pudo cargar la entrega anterior.');
    if (!e || !e.uploaded_at || !['REJECTED', 'CHANGES_REQUESTED'].includes(e.review_status))
      notFound();
    context = {
      organization_id: e.organization_id,
      control_id: e.control_id,
      finding_id: e.finding_id,
      task_id: e.task_id,
      previous_evidence_id: e.id,
    };
    description = `Nueva entrega de ${e.original_filename}. Observaciones: ${e.reviewer_comment}`;
  }
  const scope = await organizationScope(context.organization_id);
  let label = 'Documento de la organización';
  let writable = scope.organization.status === 'ACTIVE';
  if (context.task_id) {
    const t = await taskScope(context.task_id);
    if (t.organization.id !== context.organization_id) notFound();
    writable =
      writable &&
      t.task.status !== 'DONE' &&
      !['CLOSED', 'ACCEPTED_RISK'].includes(t.finding.status);
    label = `Tarea: ${t.task.title}`;
    context.finding_id = t.finding.id;
  }
  if (context.finding_id) {
    const f = await findingScope(context.finding_id);
    if (f.organization.id !== context.organization_id) notFound();
    writable = writable && !['CLOSED', 'ACCEPTED_RISK'].includes(f.finding.status);
    if (!context.task_id) label = `Hallazgo: ${f.finding.title}`;
  }
  if (context.control_id) {
    if (!z.uuid().safeParse(context.control_id).success) notFound();
    const { data: c, error } = await db
      .from('assessment_controls')
      .select('id,organization_id')
      .eq('id', context.control_id)
      .maybeSingle();
    if (error || !c || c.organization_id !== context.organization_id) notFound();
    if (!context.finding_id) label = 'Evidencia del control histórico';
  }
  return (
    <>
      <div>
        <h1 className="page-title">
          {p.previous ? 'Nueva entrega de evidencia' : 'Nueva evidencia'}
        </h1>
        <p className="muted mt-2">
          {scope.organization.legal_name} · {label}
        </p>
      </div>
      <WorkflowNav org={scope.organization.id} />
      <section className="panel">
        {description && (
          <p className="text-sm whitespace-pre-wrap break-words mb-5">{description}</p>
        )}
        {writable ? (
          <UploadForm context={context} />
        ) : (
          <p className="muted">
            Reabra la tarea o el hallazgo y active la organización para agregar una entrega.
          </p>
        )}
      </section>
      <Link className="text-sm underline" href={`/evidence?organization=${scope.organization.id}`}>
        Volver a evidencias
      </Link>
    </>
  );
}
