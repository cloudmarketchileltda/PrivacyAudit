import Link from 'next/link';
import { Plus } from 'lucide-react';
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
  const { data, count, error } = await query.range((page - 1) * 20, page * 20 - 1);
  if (error) throw error;
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div>
          <h1 className="page-title">Organizaciones</h1>
          <p className="muted mt-2">Empresas a las que su cuenta tiene acceso.</p>
        </div>
        {profile.role !== 'CLIENT' && (
          <Button asChild>
            <Link href="/organizations/new">
              <Plus size={16} />
              Nueva organización
            </Link>
          </Button>
        )}
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
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Organización</th>
              <th>RUT</th>
              <th>Industria</th>
              <th>Estado</th>
              <th>Creación</th>
            </tr>
          </thead>
          <tbody>
            {(data as Organization[]).map((org) => (
              <tr key={org.id}>
                <td>
                  <Link
                    href={`/organizations/${org.id}`}
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
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && (
          <p className="empty">
            No se encontraron organizaciones.{' '}
            {profile.role === 'CLIENT'
              ? 'Abra su enlace de invitación para vincularse a una empresa.'
              : 'Cree una organización para comenzar.'}
          </p>
        )}
      </div>
      <Pagination page={page} count={count || 0} path="/organizations" params={params} />
    </>
  );
}
