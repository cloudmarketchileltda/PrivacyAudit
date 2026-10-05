import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { ControlForm, type CatalogControl } from '@/features/controls/control-form';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, profile } = await requireUser();
  const { data, error } = await db.from('controls').select('*').eq('id', id).single();
  if (error || !data) notFound();
  const control = data as CatalogControl;
  return (
    <>
      <h1 className="page-title">
        {control.code} · {control.title}
      </h1>
      <section className="panel max-w-4xl">
        {profile.role === 'SUPER_ADMIN' ? (
          <ControlForm control={control} />
        ) : (
          <div className="space-y-6">
            {[
              ['Categoría', control.category],
              ['Descripción', control.description],
              ['Objetivo', control.objective],
              ['Orientación', control.guidance],
              ['Referencia normativa', control.normative_reference],
              [
                'Revisión jurídica',
                control.legal_review_status === 'PENDING'
                  ? 'Pendiente de revisión jurídica'
                  : 'Revisada por profesional',
              ],
            ].map(([label, text]) => (
              <div key={label}>
                <h2 className="section-title mb-2">{label}</h2>
                <p className="text-sm leading-6 whitespace-pre-wrap">{text || 'Sin registrar'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
