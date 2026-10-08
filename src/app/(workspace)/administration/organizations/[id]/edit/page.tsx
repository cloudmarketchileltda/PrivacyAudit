import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { OrganizationForm } from '@/features/organizations/organization-form';
import type { Organization } from '@/types/domain';
import { z } from '@/lib/validation';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  const { data, error } = await db.from('organizations').select('*').eq('id', id).single();
  if (error || !data) notFound();
  return (
    <>
      <h1 className="page-title">Editar organización</h1>
      <section className="panel">
        <OrganizationForm organization={data as Organization} />
      </section>
    </>
  );
}
