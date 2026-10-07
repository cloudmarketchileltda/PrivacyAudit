import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { auditActionLabels, auditEntityLabels, auditRoleLabels } from '@/features/audit/model';
import { auditQuery } from '@/features/audit/queries';
import { PurgeForm } from '@/features/audit/purge-form';
import { Pagination, pageNumber } from '@/components/table-tools';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  const page = pageNumber(params.page);
  const [{ data, count, error }, { data: orgs, error: oe }, { data: actors, error: ae }] =
    await Promise.all([
      auditQuery(db, params)
        .order('created_at', { ascending: false })
        .order('id')
        .range((page - 1) * 20, page * 20 - 1),
      db.from('organizations').select('id,legal_name').order('legal_name'),
      db.from('profiles').select('id,full_name').order('full_name'),
    ]);
  if (error || oe || ae) throw error || oe || ae;
  const exportParams = new URLSearchParams(
    Object.entries(params).filter(([k, v]) => k !== 'page' && v !== undefined) as [
      string,
      string,
    ][],
  );
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <Link href="/administration" className="muted underline">
            Administración
          </Link>
          <h1 className="page-title mt-2">Log auditable</h1>
          <p className="muted mt-2">
            Actor, fecha, acción, entidad y cambios registrados automáticamente.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href={`/api/administration/audit/export?${exportParams}`}>Exportar CSV</a>
        </Button>
      </div>
      <form className="panel p-4 flex flex-wrap gap-3 items-end">
        <label className="form-label">
          Organización
          <select className="field" name="organization" defaultValue={params.organization || ''}>
            <option value="">Todas / eventos globales</option>
            {orgs?.map((o) => (
              <option value={o.id} key={o.id}>
                {o.legal_name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Actor
          <select className="field" name="actor" defaultValue={params.actor || ''}>
            <option value="">Todos</option>
            {actors?.map((a) => (
              <option value={a.id} key={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Acción
          <select
            aria-label="Acción"
            className="field"
            name="action"
            defaultValue={params.action || ''}
          >
            <option value="">Todas</option>
            {Object.entries(auditActionLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Entidad
          <select
            aria-label="Entidad"
            name="entity"
            className="field"
            defaultValue={params.entity || ''}
          >
            <option value="">Todas</option>
            {Object.entries(auditEntityLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Desde (Chile)
          <input className="field" name="from" type="date" defaultValue={params.from} />
        </label>
        <label className="form-label">
          Hasta (Chile)
          <input className="field" name="to" type="date" defaultValue={params.to} />
        </label>
        <Button variant="outline">Filtrar</Button>
        <Link href="/administration/audit" className="text-sm underline">
          Limpiar
        </Link>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Actor</th>
              <th>Organización</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id}>
                <td className="whitespace-nowrap">{formatDateTime(a.created_at)}</td>
                <td>
                  {a.actor_name}
                  <p className="muted">{auditRoleLabels[a.actor_role] || a.actor_role}</p>
                </td>
                <td>{a.organization_name || 'Sistema'}</td>
                <td>
                  <span className="badge">{auditActionLabels[a.action] || a.action}</span>
                </td>
                <td>
                  {auditEntityLabels[a.entity_type] || a.entity_type}
                  <p className="muted text-xs break-all max-w-48">{a.entity_id}</p>
                </td>
                <td>
                  <details>
                    <summary className="cursor-pointer text-teal-800">Ver cambios</summary>
                    <pre className="whitespace-pre-wrap break-all max-w-lg text-xs mt-2">
                      {JSON.stringify(a.metadata, null, 2)}
                    </pre>
                    <p className="muted text-xs mt-2">Evento: {a.id}</p>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && <div className="empty">Sin eventos para estos filtros.</div>}
      </div>
      <Pagination page={page} count={count || 0} path="/administration/audit" params={params} />
      <section className="panel p-5">
        <h2 className="section-title">Conservación y borrado del log</h2>
        <PurgeForm />
      </section>
    </>
  );
}
