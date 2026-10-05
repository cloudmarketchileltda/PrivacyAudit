import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
import { responseFromRow } from '@/features/assessments/model';
import { controlLabels } from '@/features/assessments/model';
import { ActionForm } from '@/components/forms';
import { saveClientComment } from '@/features/assessments/actions';
import { ResponseForm } from '@/features/assessments/response-form';
import { formatDate } from '@/lib/utils';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; responseId: string }>;
}) {
  const { id, responseId } = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(responseId).success) notFound();
  const { db } = await requireUser();
  const { data, error } = await db
    .from('assessment_controls')
    .select('*')
    .eq('assessment_id', id)
    .eq('id', responseId)
    .single();
  if (error || !data) notFound();
  const response = responseFromRow(data);
  const [{ data: manager }, { data: assessment }] = await Promise.all([
    db.rpc('can_manage_organization', { org: response.organization_id }),
    db.from('assessments').select('name,status').eq('id', id).single(),
  ]);
  return (
    <>
      <Link className="text-sm underline text-teal-800" href={`/assessments/${id}`}>
        Volver a {assessment?.name}
      </Link>
      <div>
        <p className="muted mb-2">
          {response.snapshot.code} · {response.snapshot.category}
        </p>
        <h1 className="page-title">{response.snapshot.title}</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="panel space-y-6">
          {[
            ['Descripción', response.snapshot.description],
            ['Objetivo', response.snapshot.objective],
            ['Orientación', response.snapshot.guidance],
            ['Referencia normativa', response.snapshot.normative_reference],
          ].map(([label, text]) => (
            <div key={label}>
              <h2 className="section-title mb-2">{label}</h2>
              <p className="text-sm leading-6 whitespace-pre-wrap">{text || 'Sin registrar'}</p>
            </div>
          ))}
          <p className="badge">
            {response.snapshot.legal_review_status === 'PENDING'
              ? 'Pendiente de revisión jurídica'
              : 'Referencia revisada por profesional'}
          </p>
          <p className="muted">
            {response.snapshot.requires_evidence
              ? 'Este control prevé evidencia documental.'
              : 'Este control no exige evidencia documental en el catálogo.'}
          </p>
        </section>
        <section className="panel">
          <h2 className="section-title">Evaluación del control</h2>
          {manager && assessment?.status !== 'COMPLETED' ? (
            <ResponseForm response={response} />
          ) : (
            <dl className="space-y-5">
              <div>
                <dt className="muted">Estado</dt>
                <dd className="font-semibold mt-1">{controlLabels[response.status]}</dd>
              </div>
              <div>
                <dt className="muted">Comentario del consultor</dt>
                <dd className="text-sm whitespace-pre-wrap mt-1">
                  {response.auditor_comment || 'Sin comentario'}
                </dd>
              </div>
              <div>
                <dt className="muted">Motivo de no aplicabilidad</dt>
                <dd className="text-sm whitespace-pre-wrap mt-1">
                  {response.applicability_reason || 'Sin registrar'}
                </dd>
              </div>
              {manager && <p className="muted">Reabra la evaluación para editar este control.</p>}
            </dl>
          )}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold mb-3">Comentario del cliente</h3>
            {!manager ? (
              <ActionForm action={saveClientComment} label="Guardar comentario">
                <input type="hidden" name="response_id" value={response.id} />
                <label className="form-label">
                  Observaciones
                  <textarea
                    name="comment_text"
                    className="field"
                    rows={4}
                    maxLength={10000}
                    defaultValue={response.client_comment}
                  />
                </label>
              </ActionForm>
            ) : (
              <p className="text-sm whitespace-pre-wrap">
                {response.client_comment || 'Sin comentario'}
              </p>
            )}
          </div>
          {response.evaluated_at && (
            <p className="muted mt-6">
              Evaluado el {formatDate(response.evaluated_at)}
              <br />
              Usuario: <span className="break-all">{response.evaluated_by}</span>
            </p>
          )}
        </section>
      </div>
    </>
  );
}
