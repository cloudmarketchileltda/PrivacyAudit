import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { OrganizationForm } from '@/features/organizations/organization-form';
export default async function Page() {
  const { profile } = await requireUser();
  if (profile.role === 'CLIENT') notFound();
  return (
    <>
      <div>
        <h1 className="page-title">Nueva organización</h1>
        <p className="muted mt-2">Registre la empresa y su perfil de tratamiento.</p>
      </div>
      <section className="panel">
        <OrganizationForm />
      </section>
    </>
  );
}
