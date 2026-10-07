import { requireUser } from '@/features/auth/queries';
import { CommentForm } from './comment-form';
import { formatDateTime } from '@/lib/utils';
export async function Comments({
  org,
  kind,
  item,
  writable,
}: {
  org: string;
  kind: 'finding' | 'task' | 'evidence';
  item: string;
  writable: boolean;
}) {
  const { db } = await requireUser();
  const { data, error } = await db
    .from('comments')
    .select('*')
    .eq(`${kind}_id`, item)
    .order('created_at', { ascending: false })
    .order('id')
    .limit(100);
  if (error) throw new Error('No se pudieron cargar los comentarios.');
  const authors = [...new Set(data.map((c) => c.created_by))];
  const { data: profiles, error: profileError } = authors.length
    ? await db.from('profiles').select('id,full_name').in('id', authors)
    : { data: [], error: null };
  if (profileError) throw new Error('No se pudieron cargar los autores.');
  return (
    <section className="panel">
      <h2 className="section-title">Comentarios</h2>
      <p className="muted mb-4">
        Últimos 100 comentarios, en orden cronológico. Se conserva autor y fecha.
      </p>
      {!data.length && <p className="muted mb-4">Todavía no hay comentarios.</p>}
      <ol className="space-y-4 mb-6">
        {data.toReversed().map((c) => (
          <li key={c.id} className="border-b border-slate-100 pb-3">
            <p className="muted">
              {formatDateTime(c.created_at)} ·{' '}
              {profiles?.find((p) => p.id === c.created_by)?.full_name || 'Usuario'}
            </p>
            <p className="text-sm whitespace-pre-wrap break-words mt-1">{c.body}</p>
          </li>
        ))}
      </ol>
      {writable && <CommentForm org={org} kind={kind} item={item} />}
    </section>
  );
}
