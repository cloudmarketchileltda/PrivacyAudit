import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { ControlForm } from '@/features/controls/control-form';
export default async function Page() {
  const { profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  return (
    <>
      <h1 className="page-title">Nuevo control</h1>
      <section className="panel max-w-4xl">
        <ControlForm />
      </section>
    </>
  );
}
