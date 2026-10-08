import { notFound } from 'next/navigation';
import { DeleteOrganizationButton } from '@/features/organizations/delete-organization-button';
import { pageRange } from '@/config/general';
import Link from 'next/link';
import { Plus, Pencil, Eye } from 'lucide-react';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import { formatDate } from '@/lib/utils';
import type { Organization } from '@/types/domain';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  let query = db
    .from('organizations')
    .select('*', { count: 'exact' })
    .order(params.sort === 'recent' ? 'created_at' : 'legal_name', {
      ascending: params.sort !== 'recent',
    });
  const q = searchTerm(params.q);
  if (q) query = query.or(`legal_name.ilike.%${q}%,rut.ilike.%${q}%,trade_name.ilike.%${q}%`);
  if (['ACTIVE', 'ARCHIVED'].includes(params.status || ''))
    query = query.eq('status', params.status as Organization['status']);
  const { data, count, error } = await query.range(...pageRange(page));
  if (error) throw error;
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div>
          <h1 className="page-title">Organizaciones</h1>
          <p className="muted mt-2">Administrar las organizaciones del sistema.</p>
        </div>
        <Button asChild>
          <Link href="/administration/organizations/new">
            <Plus size={16} />
            Nueva organización
          </Link>
        </Button>
      </div>
      <form className="flex flex-wrap gap-3 items-end">
        <label className="form-label flex-1 min-w-40">
          Buscar
          <input
            name="q"
            className="field"
            defaultValue={params.q}
            placeholder="Razón social, nombre o RUT"
          />
        </label>
        <label className="form-label">
          Estado
          <select className="field" name="status" defaultValue={params.status || ''}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activas</option>
            <option value="ARCHIVED">Archivadas</option>
          </select>
        </label>
        <label className="form-label">
          Orden
          <select className="field" name="sort" defaultValue={params.sort || 'name'}>
            <option value="name">Razón social</option>
            <option value="recent">Más recientes</option>
          </select>
        </label>
        <Button variant="outline">Filtrar</Button>
      </form>
      <div className="table-wrap scroll-grid accounts-grid">
        <table className="data-table">
          <thead>
            <tr>
              <th>Organización</th>
              <th>RUT</th>
              <th>Industria</th>
              <th>Estado</th>
              <th>Creación</th>
              <th>Ver</th>
              <th>Modificar</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {(data as Organization[]).map((org) => (
              <tr key={org.id}>
                <td>
                  <Link
                    href={`/administration/organizations/${org.id}`}
                    className="font-semibold text-teal-800 hover:underline"
                  >
                    {org.legal_name}
                  </Link>
                  <p className="muted">{org.trade_name}</p>
                </td>
                <td className="whitespace-nowrap">{org.rut}</td>
                <td>{org.industry || 'Sin registrar'}</td>
                <td>
                  <span className="badge">{org.status === 'ACTIVE' ? 'Activa' : 'Archivada'}</span>
                </td>
                <td className="whitespace-nowrap">{formatDate(org.created_at)}</td>
                <td>
                  <Button
                    asChild
                    size="icon"
                    title="Ver organización"
                    aria-label={`Ver organización: ${org.legal_name}`}
                  >
                    <Link href={`/administration/organizations/${org.id}`}>
                      <Eye size={18} />
                    </Link>
                  </Button>
                </td>
                <td>
                  <Button
                    asChild
                    variant="edit"
                    size="icon"
                    title="Modificar organización"
                    aria-label={`Modificar organización: ${org.legal_name}`}
                  >
                    <Link href={`/administration/organizations/${org.id}/edit`}>
                      <Pencil size={18} />
                    </Link>
                  </Button>
                </td>
                <td>
                  <DeleteOrganizationButton id={org.id} name={org.legal_name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && (
          <p className="empty">
            No se encontraron organizaciones. Cree una organización para comenzar.
          </p>
        )}
      </div>
      <Pagination
        page={page}
        count={count || 0}
        path="/administration/organizations"
        params={params}
      />
    </>
  );
}
