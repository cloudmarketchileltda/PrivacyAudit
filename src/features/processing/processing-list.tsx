import { HelpDialog } from '@/components/help-dialog';
import { pageRange } from '@/config/general';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { z } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import { statusLabels, tristateLabels, optionKeys } from './schemas';
import { processingOrganization } from './queries';
import { ProcessingNav } from './organization-nav';
import { formatDate } from '@/lib/utils';
export async function ProcessingList({
  params,
  organizationId,
}: {
  params: Record<string, string | undefined>;
  organizationId?: string;
}) {
  const selectedOrg = organizationId || params.organization;
  const scope = selectedOrg ? await processingOrganization(selectedOrg) : null;
  const session = scope || (await requireUser());
  if (selectedOrg && !z.uuid().safeParse(selectedOrg).success) notFound();
  const page = pageNumber(params.page);
  const sort = params.sort === 'name' ? 'name' : 'updated_at';
  let query = session.db
    .from('processing_activities')
    .select('id,organization_id,name,area,owner,status,international_transfer,updated_at', {
      count: 'exact',
    })
    .order(sort, { ascending: sort === 'name' })
    .order('id');
  const q = searchTerm(params.q);
  if (q) query = query.or(`name.ilike.%${q}%,area.ilike.%${q}%,owner.ilike.%${q}%`);
  if (selectedOrg) query = query.eq('organization_id', selectedOrg);
  const status = z.enum(optionKeys(statusLabels)).safeParse(params.status);
  if (status.success) query = query.eq('status', status.data);
  const transfer = z.enum(optionKeys(tristateLabels)).safeParse(params.transfer);
  if (transfer.success) query = query.eq('international_transfer', transfer.data);
  const [{ data, count, error }, { data: organizations, error: orgError }] = await Promise.all([
    query.range(...pageRange(page)),
    session.db.from('organizations').select('id,legal_name').order('legal_name'),
  ]);
  if (error || orgError) throw new Error('No se pudo cargar el registro de tratamientos.');
  const path = organizationId ? `/organizations/${organizationId}/processing` : '/processing';
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {scope && <p className="muted mb-1">{scope.organization.legal_name}</p>}
          <div className="flex items-center gap-3">
            <h1 className="page-title">Tratamientos</h1>
            <HelpDialog title="Cómo registrar actividades de tratamiento">
              <p className="muted">
                Un tratamiento es una actividad en la que la organización utiliza datos personales,
                como gestionar trabajadores, facturar a clientes o realizar campañas comerciales.
              </p>
              <p className="muted">
                Este inventario describe qué datos se usan, de quiénes, con qué finalidad, quién es
                responsable, en qué sistemas se almacenan, con quién se comparten y cuánto tiempo se
                conservan.
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-6">
                <li>Seleccione una organización en el filtro y pulse Filtrar.</li>
                <li>
                  Pulse Nuevo tratamiento. Esta acción está disponible para el administrador o
                  consultor asignado en organizaciones activas.
                </li>
                <li>
                  Complete el nombre, finalidad, categorías de titulares y datos, junto con la
                  información disponible del proceso, y guarde el registro.
                </li>
              </ol>
              <p className="muted">
                Los tratamientos pertenecen a la organización. Sirven de contexto para el
                diagnóstico y se incluyen en el informe; no se asocian directamente a una evaluación
                ni generan hallazgos automáticamente. El cliente solo puede consultarlos. Una
                organización archivada es de solo lectura.
              </p>
            </HelpDialog>
          </div>
          <p className="muted mt-2">
            Registro de actividades, datos, finalidades y responsables por organización.
          </p>
        </div>
        {scope?.canEdit && (
          <Button asChild>
            <Link href={`/organizations/${scope.organization.id}/processing/new`}>
              Nuevo tratamiento
            </Link>
          </Button>
        )}
      </div>
      {!scope && (
        <p className="muted">
          Seleccione una organización y pulse Filtrar para consultar sus tratamientos y, si tiene
          permisos, registrar uno nuevo.
        </p>
      )}
      {organizationId && <ProcessingNav id={organizationId} />}
      {scope?.organization.status === 'ARCHIVED' && (
        <p className="muted">
          La organización está archivada. Sus tratamientos se conservan para consulta.
        </p>
      )}
      <form className="flex flex-wrap items-end gap-3">
        <label className="form-label flex-1 min-w-40">
          Buscar
          <input
            className="field"
            name="q"
            defaultValue={params.q}
            placeholder="Nombre, área o responsable"
          />
        </label>
        {!organizationId && (
          <label className="form-label">
            Organización
            <select className="field max-w-64" name="organization" defaultValue={selectedOrg || ''}>
              <option value="">Todas</option>
              {organizations?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.legal_name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="form-label">
          Estado
          <select className="field" name="status" defaultValue={status.success ? status.data : ''}>
            <option value="">Todos</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Transferencias internacionales
          <select
            className="field"
            name="transfer"
            defaultValue={transfer.success ? transfer.data : ''}
          >
            <option value="">Todas</option>
            {Object.entries(tristateLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="form-label">
          Orden
          <select className="field" name="sort" defaultValue={sort}>
            <option value="updated_at">Última actualización</option>
            <option value="name">Nombre</option>
          </select>
        </label>
        <Button variant="outline">Filtrar</Button>
        <Button variant="outline" asChild>
          <Link href={path}>Limpiar filtros</Link>
        </Button>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tratamiento</th>
              {!organizationId && <th>Organización</th>}
              <th>Área</th>
              <th>Responsable</th>
              <th>Estado</th>
              <th>Transferencias</th>
              <th>Actualización</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id}>
                <td className="min-w-48 max-w-sm break-words">
                  <Link
                    className="text-teal-800 font-semibold hover:underline"
                    href={`/organizations/${a.organization_id}/processing/${a.id}`}
                  >
                    {a.name}
                  </Link>
                </td>
                {!organizationId && (
                  <td className="min-w-40 max-w-xs break-words">
                    <Link
                      className="hover:underline"
                      href={`/organizations/${a.organization_id}/processing`}
                    >
                      {organizations?.find((o) => o.id === a.organization_id)?.legal_name}
                    </Link>
                  </td>
                )}
                <td className="min-w-32 max-w-xs break-words">{a.area || 'Sin registrar'}</td>
                <td className="min-w-32 max-w-xs break-words">{a.owner || 'Sin registrar'}</td>
                <td>
                  <span className="badge">{statusLabels[a.status]}</span>
                </td>
                <td>{tristateLabels[a.international_transfer]}</td>
                <td className="whitespace-nowrap">{formatDate(a.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && (
          <p className="empty">
            No se encontraron tratamientos.
            {scope?.canEdit ? ' Registre una actividad o ajuste los filtros.' : ''}
          </p>
        )}
      </div>
      <Pagination page={page} count={count || 0} path={path} params={params} />
    </>
  );
}
