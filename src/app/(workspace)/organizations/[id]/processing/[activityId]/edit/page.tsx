import { notFound } from 'next/navigation';
import { processingActivity } from '@/features/processing/queries';
import { ProcessingForm } from '@/features/processing/processing-form';
import { ProcessingNav } from '@/features/processing/organization-nav';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; activityId: string }>;
}) {
  const { id, activityId } = await params;
  const { organization, activity, canEdit } = await processingActivity(id, activityId);
  if (!canEdit) notFound();
  return (
    <>
      <div>
        <p className="muted mb-1">{organization.legal_name} / Tratamientos</p>
        <h1 className="page-title">Editar tratamiento</h1>
      </div>
      <ProcessingNav id={id} />
      <section className="panel">
        <ProcessingForm organizationId={id} activity={activity} />
      </section>
    </>
  );
}
