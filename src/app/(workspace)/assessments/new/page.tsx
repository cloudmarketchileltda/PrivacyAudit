import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { ActionForm, Field } from '@/components/forms';
import { createAssessment } from '@/features/assessments/actions';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { organization } = await searchParams;
  const { db, profile } = await requireUser();
  if (profile.role === 'CLIENT') notFound();
  const { data, error } = await db
    .from('organizations')
    .select('id,legal_name')
    .eq('status', 'ACTIVE')
    .order('legal_name');
  if (error) throw error;
  return (
    <>
      <h1 className="page-title">Nueva evaluación</h1>
      <section className="panel max-w-3xl">
        {!data.length ? (
          <p className="muted">Cree una organización activa antes de iniciar una evaluación.</p>
        ) : (
          <ActionForm action={createAssessment} label="Crear evaluación" variant="default">
            <label className="form-label">
              Organización
              <select name="organization_id" className="field" required defaultValue={organization}>
                {data.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.legal_name}
                  </option>
                ))}
              </select>
            </label>
            <Field name="name" label="Nombre de la evaluación" required />
            <label className="form-label">
              Descripción y alcance
              <textarea name="description" className="field" rows={4} maxLength={5000} />
            </label>
            <p className="muted">
              Se incorporará una copia de los controles activos del catálogo. El contenido quedará
              conservado para esta evaluación.
            </p>
          </ActionForm>
        )}
      </section>
    </>
  );
}
