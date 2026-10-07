import Link from 'next/link';
import { processingActivity } from '@/features/processing/queries';
import { ProcessingNav } from '@/features/processing/organization-nav';
import {
  statusLabels,
  subjectLabels,
  dataLabels,
  basisLabels,
  tristateLabels,
} from '@/features/processing/schemas';
import { deleteProcessing } from '@/features/processing/actions';
import { Button } from '@/components/ui/button';
import { ActionForm, Field } from '@/components/forms';
import { formatDate } from '@/lib/utils';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; activityId: string }>;
}) {
  const { id, activityId } = await params;
  const { organization, activity: a, canEdit } = await processingActivity(id, activityId);
  const labels = (values: string[], dictionary: Record<string, string>) =>
    values.map((v) => dictionary[v] || v).join(', ');
  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="muted mb-1">{organization.legal_name} / Tratamientos</p>
          <h1 className="page-title break-words">{a.name}</h1>
          <p className="muted mt-2">
            {statusLabels[a.status]} · Actualizado {formatDate(a.updated_at)}
          </p>
        </div>
        {canEdit && (
          <Button variant="outline" asChild>
            <Link href={`/organizations/${id}/processing/${activityId}/edit`}>
              Editar tratamiento
            </Link>
          </Button>
        )}
      </div>
      <ProcessingNav id={id} />
      {organization.status === 'ARCHIVED' && (
        <p className="muted">
          La organización está archivada. Sus tratamientos se conservan para consulta.
        </p>
      )}
      <section className="panel">
        <h2 className="section-title">Registro de actividad de tratamiento</h2>
        <dl className="form-grid">
          {[
            ['Área', a.area],
            ['Responsable interno', a.owner],
            ['Finalidad', a.purpose],
            ['Tipos de titulares', labels(a.data_subject_categories, subjectLabels)],
            ['Categorías de datos', labels(a.personal_data_categories, dataLabels)],
            ['Datos sensibles', tristateLabels[a.sensitive_data]],
            ['Origen de los datos', a.source],
            ['Base de licitud propuesta', basisLabels[a.legal_basis as keyof typeof basisLabels]],
            ['Explicación de la base de licitud', a.legal_basis_details],
            ['Sistemas', a.systems],
            ['Destinatarios', a.recipients],
            ['Encargados y proveedores', a.processors],
            ['Transferencias internacionales', tristateLabels[a.international_transfer]],
            ['Detalle de transferencias', a.international_transfer_details],
            ['Plazo de conservación', a.retention_period],
            ['Criterios de conservación y eliminación', a.retention_criteria],
            ['Medidas de seguridad', a.security_measures],
            ['Observaciones', a.notes],
            ['Fecha de creación', formatDate(a.created_at)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="muted">{label}</dt>
              <dd className="text-sm mt-1 whitespace-pre-wrap break-words">
                {value || 'Sin registrar'}
              </dd>
            </div>
          ))}
        </dl>
        <p className="muted mt-6">
          La base de licitud registrada requiere revisión profesional; el registro no certifica su
          validez jurídica.
        </p>
      </section>
      {canEdit && (
        <details className="panel">
          <summary className="text-sm font-semibold cursor-pointer">Eliminar tratamiento</summary>
          <p className="muted my-4">
            Para conservar el registro, puede cambiar su estado a Archivado al editarlo. La
            eliminación es permanente. Escriba ELIMINAR para confirmarla.
          </p>
          <ActionForm
            action={deleteProcessing}
            label="Eliminar definitivamente"
            variant="destructive"
          >
            <input type="hidden" name="organization_id" value={id} />
            <input type="hidden" name="id" value={activityId} />
            <Field label="Confirmación" name="confirmation" required />
          </ActionForm>
        </details>
      )}
    </>
  );
}
