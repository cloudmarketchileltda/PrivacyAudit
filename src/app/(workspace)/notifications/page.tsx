import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { markRead } from '@/features/notifications/actions';
import { eventLabels, notificationHref } from '@/features/notifications/model';
import { Pagination, pageNumber } from '@/components/table-tools';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { z } from '@/lib/validation';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const { db } = await requireUser();
  let query = db
    .from('notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .order('id');
  if (params.read === 'unread') query = query.is('read_at', null);
  if (params.read === 'read') query = query.not('read_at', 'is', null);
  if (params.type && eventLabels[params.type]) query = query.eq('event_type', params.type);
  if (z.uuid().safeParse(params.organization).success)
    query = query.eq('organization_id', params.organization!);
  const [{ data, count, error }, { data: orgs, error: orgError }] = await Promise.all([
    query.range((page - 1) * 20, page * 20 - 1),
    db.from('organizations').select('id,legal_name').order('legal_name'),
  ]);
  if (error || orgError) throw error || orgError;
  return (
    <>
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="page-title">Notificaciones internas</h1>
          <p className="muted mt-2">
            Asignaciones, revisiones y vencimientos de sus organizaciones.
          </p>
        </div>
        <form action={markRead}>
          <Button variant="outline">Marcar todas como leídas</Button>
        </form>
      </div>
      <form className="panel p-4 flex flex-wrap gap-3 items-end">
        <label className="form-label">
          Lectura
          <select
            aria-label="Lectura"
            name="read"
            defaultValue={params.read || ''}
            className="field"
          >
            <option value="">Todas</option>
            <option value="unread">Sin leer</option>
            <option value="read">Leídas</option>
          </select>
        </label>
        <label className="form-label">
          Evento
          <select
            aria-label="Evento"
            name="type"
            defaultValue={params.type || ''}
            className="field"
          >
            <option value="">Todos</option>
            {Object.entries(eventLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Organización
          <select
            aria-label="Organización"
            name="organization"
            defaultValue={params.organization || ''}
            className="field"
          >
            <option value="">Todas</option>
            {orgs?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.legal_name}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline">Filtrar</Button>
      </form>
      <div className="space-y-3">
        {data?.map((n) => (
          <article
            key={n.id}
            className={`panel p-5 ${!n.read_at ? 'border-l-4 border-l-teal-700' : ''}`}
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="muted text-xs">
                  {orgs?.find((o) => o.id === n.organization_id)?.legal_name} ·{' '}
                  {formatDateTime(n.created_at)} · {n.read_at ? 'Leída' : 'Sin leer'}
                </p>
                <h2 className="font-semibold mt-2">{n.title}</h2>
                <p className="muted mt-1">{n.message}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={notificationHref(n)} className="text-teal-800 underline">
                  Abrir registro
                </Link>
                {!n.read_at && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <Button variant="outline">Marcar como leída</Button>
                  </form>
                )}
              </div>
            </div>
          </article>
        ))}
        {!data?.length && <div className="empty">No hay notificaciones para estos filtros.</div>}
      </div>
      <Pagination page={page} count={count || 0} path="/notifications" params={params} />
      <p className="muted">
        Las tareas vencidas se comprueban cada 15 minutos. Las notificaciones se muestran únicamente
        dentro de PrivacyAudit.
      </p>
    </>
  );
}
