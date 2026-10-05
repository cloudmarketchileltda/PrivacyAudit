import { redirect } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { enrollConsultant } from '@/features/auth/actions';
import { ActionForm } from '@/components/forms';
export default async function Page() {
  const { profile } = await requireUser();
  if (profile.role !== 'CLIENT') redirect('/dashboard');
  return (
    <main className="max-w-xl mx-auto p-6 mt-12">
      <section className="panel">
        <h1 className="page-title mb-4">Bienvenido a PrivacyAudit</h1>
        <p className="muted mb-6">
          Si creó una cuenta para trabajar como consultor, active su espacio. Si es usuario de una
          empresa cliente, abra el enlace de invitación proporcionado por su consultor.
        </p>
        <ActionForm action={enrollConsultant} label="Activar cuenta de consultor" />
      </section>
    </main>
  );
}
