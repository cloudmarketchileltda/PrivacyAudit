import { ReviewForm } from '@/features/evidence/review-form';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { organizationScope } from '@/features/workflow/queries';
import { WorkflowNav } from '@/features/workflow/nav';
import { Comments } from '@/features/evidence/comments';
import { reviewLabels } from '@/features/evidence/schemas';
import { finalizeEvidence, cancelEvidence } from '@/features/evidence/actions';
import { ActionForm } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { z } from '@/lib/validation';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, user } = await requireUser();
  const { data: e, error } = await db.from('evidence').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error('No se pudo cargar la evidencia.');
  if (!e) notFound();
  const scope = await organizationScope(e.organization_id);
  const [
    { data: next, error: nextError },
    { data: logs, error: logError },
    { data: finding, error: fError },
    { data: task, error: tError },
    { data: control, error: cError },
  ] = await Promise.all([
    db.from('evidence').select('id,uploaded_at').eq('previous_evidence_id', id).maybeSingle(),
    db
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'evidence')
      .eq('entity_id', id)
      .order('created_at')
      .order('id')
      .limit(100),
    e.finding_id
      ? db.from('findings').select('id,title,status').eq('id', e.finding_id).single()
      : Promise.resolve({ data: null, error: null }),
    e.task_id
      ? db.from('tasks').select('id,title,status').eq('id', e.task_id).single()
      : Promise.resolve({ data: null, error: null }),
    e.control_id
      ? db
          .from('assessment_controls')
          .select('id,assessment_id,snapshot')
          .eq('id', e.control_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (nextError || logError || fError || tError || cError)
    throw new Error('No se pudo cargar el historial.');
  const actors = [
    ...new Set([
      e.uploaded_by,
      ...(e.reviewed_by ? [e.reviewed_by] : []),
      ...logs.map((l) => l.actor_id).filter((v): v is string => !!v),
    ]),
  ];
  const { data: profiles, error: profileError } = await db
    .from('profiles')
    .select('id,full_name')
    .in('id', actors);
  if (profileError) throw new Error('No se pudieron cargar los responsables.');
  const actor = (v: string | null) => profiles?.find((p) => p.id === v)?.full_name || 'Usuario';
  const writable =
    scope.organization.status === 'ACTIVE' &&
    !['CLOSED', 'ACCEPTED_RISK'].includes(finding?.status || '') &&
    task?.status !== 'DONE';
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4">
        <div className="min-w-0">
          <p className="muted">{scope.organization.legal_name}</p>
          <h1 className="page-title break-all">{e.original_filename}</h1>
          <p className="mt-3 badge">
            {e.uploaded_at ? reviewLabels[e.review_status] : 'Carga incompleta'}
          </p>
        </div>
        {e.uploaded_at && (
          <Button asChild variant="outline">
            <a href={`/api/evidence/${id}/download`}>Descargar archivo</a>
          </Button>
        )}
      </div>
      <WorkflowNav org={scope.organization.id} />
      <section className="panel">
        <dl className="form-grid">
          {[
            ['Descripción', e.description],
            [
              'Tamaño',
              e.file_size < 1024
                ? `${e.file_size} bytes`
                : e.file_size < 1024 * 1024
                  ? `${(e.file_size / 1024).toFixed(1)} KB`
                  : `${(e.file_size / 1024 / 1024).toFixed(2)} MB`,
            ],
            ['Autor de la entrega', actor(e.uploaded_by)],
            ['Fecha de entrega', e.uploaded_at ? formatDateTime(e.uploaded_at) : 'No confirmada'],
            ['Revisor', e.reviewed_by ? actor(e.reviewed_by) : 'Pendiente'],
            ['Fecha de revisión', e.reviewed_at ? formatDateTime(e.reviewed_at) : 'Pendiente'],
            ['Observaciones del consultor', e.reviewer_comment || 'Sin observaciones'],
          ].map(([l, v]) => (
            <div key={l}>
              <dt className="muted">{l}</dt>
              <dd className="text-sm mt-1 whitespace-pre-wrap break-words">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-4 mt-6 text-sm underline">
          {finding && <Link href={`/findings/${finding.id}`}>Hallazgo: {finding.title}</Link>}
          {task && <Link href={`/tasks/${task.id}`}>Tarea: {task.title}</Link>}
          {control && (
            <Link href={`/assessments/${control.assessment_id}/controls/${control.id}`}>
              Control histórico
            </Link>
          )}
          {e.previous_evidence_id && (
            <Link href={`/evidence/${e.previous_evidence_id}`}>Entrega anterior</Link>
          )}
          {next && (
            <Link href={`/evidence/${next.id}`}>
              {next.uploaded_at ? 'Entrega siguiente' : 'Nueva entrega en carga'}
            </Link>
          )}
        </div>
      </section>
      {!e.uploaded_at && e.uploaded_by === user.id && (
        <section className="panel space-y-5">
          <h2 className="section-title">Completar entrega</h2>
          <p className="muted">
            Si el archivo terminó de subir, confirme la entrega. Si la carga se interrumpió,
            descártela y vuelva a subir el archivo.
          </p>
          {writable && (
            <ActionForm action={finalizeEvidence} label="Confirmar entrega">
              <input type="hidden" name="id" value={id} />
            </ActionForm>
          )}
          <ActionForm
            action={cancelEvidence}
            label="Descartar carga incompleta"
            variant="destructive"
          >
            <input type="hidden" name="id" value={id} />
          </ActionForm>
        </section>
      )}
      {scope.manager && writable && e.uploaded_at && e.review_status === 'PENDING_REVIEW' && (
        <section className="panel">
          <h2 className="section-title">Revisar evidencia</h2>
          <p className="muted mb-4">
            La revisión de evidencia se registra por separado de la aprobación de tareas y del
            cierre de hallazgos.
          </p>
          <ReviewForm id={id} />
        </section>
      )}
      {writable &&
        e.uploaded_at &&
        !next &&
        ['REJECTED', 'CHANGES_REQUESTED'].includes(e.review_status) && (
          <Button asChild>
            <Link href={`/evidence/new?previous=${id}`}>Subir nueva entrega</Link>
          </Button>
        )}
      <section className="panel">
        <h2 className="section-title">Actividad de la evidencia</h2>
        <ol className="space-y-4">
          {logs.map((l) => (
            <li key={l.id} className="text-sm border-b border-slate-100 pb-3">
              <p className="muted">
                {formatDateTime(l.created_at)} · {actor(l.actor_id)}
              </p>
              <p>
                {l.action === 'UPLOAD'
                  ? 'Archivo adjuntado y enviado a revisión'
                  : `Revisión: ${reviewLabels[String((l.metadata as Record<string, unknown>).status) as keyof typeof reviewLabels] || 'Registrada'}`}
              </p>
            </li>
          ))}
        </ol>
        {!logs.length && <p className="muted">La carga todavía no está confirmada.</p>}
      </section>
      <Comments
        org={e.organization_id}
        kind="evidence"
        item={id}
        writable={scope.organization.status === 'ACTIVE'}
      />
    </>
  );
}
