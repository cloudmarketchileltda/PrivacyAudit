import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import { reviewLabels } from './schemas';
export async function Attachments({
  org,
  kind,
  item,
  writable,
}: {
  org: string;
  kind: 'control' | 'finding' | 'task';
  item: string;
  writable: boolean;
}) {
  const { db } = await requireUser();
  const { data, error } = await db
    .from('evidence')
    .select('id,original_filename,review_status,uploaded_at')
    .eq(`${kind}_id`, item)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error('No se pudieron cargar las evidencias.');
  const params = new URLSearchParams({ organization: org, [kind]: item });
  return (
    <section className="panel">
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="section-title">Evidencias</h2>
        {writable && (
          <Button asChild variant="outline">
            <Link href={`/evidence/new?${params}`}>Adjuntar evidencia</Link>
          </Button>
        )}
      </div>
      <ul className="space-y-3">
        {data.map((e) => (
          <li key={e.id} className="flex flex-wrap gap-3 text-sm">
            <Link className="underline break-all" href={`/evidence/${e.id}`}>
              {e.original_filename}
            </Link>
            <span className="badge">
              {e.uploaded_at ? reviewLabels[e.review_status] : 'Carga incompleta'}
            </span>
          </li>
        ))}
      </ul>
      {!data.length && <p className="muted">No hay evidencias adjuntas.</p>}
      <Link className="text-sm underline inline-block mt-4" href={`/evidence?${params}`}>
        Ver todas las entregas
      </Link>
    </section>
  );
}
