import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { ControlForm, type CatalogControl } from '@/features/controls/control-form';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  const { data, error } = await db.from('controls').select('*').eq('id', id).single();
  if (error || !data) notFound();
  const control = data as CatalogControl;
  return (
    <>
      <h1 className="page-title">
        {control.code} · {control.title}
      </h1>
      <section className="panel max-w-4xl">
        <ControlForm control={control} />
      </section>
    </>
  );
}
