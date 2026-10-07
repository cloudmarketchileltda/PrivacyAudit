import { notFound } from 'next/navigation';
import { processingOrganization } from '@/features/processing/queries';
import { ProcessingForm } from '@/features/processing/processing-form';
import { ProcessingNav } from '@/features/processing/organization-nav';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, canEdit } = await processingOrganization(id);
  if (!canEdit) notFound();
  return (
    <>
      <div>
        <p className="muted mb-1">{organization.legal_name} / Tratamientos</p>
        <h1 className="page-title">Nuevo tratamiento</h1>
      </div>
      <ProcessingNav id={id} />
      <section className="panel">
        <ProcessingForm organizationId={id} />
      </section>
    </>
  );
}
