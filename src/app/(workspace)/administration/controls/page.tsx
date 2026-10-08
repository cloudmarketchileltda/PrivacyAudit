import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { DeleteControlButton } from '@/features/controls/delete-control-button';
import { pageRange } from '@/config/general';
import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import type { CatalogControl } from '@/features/controls/control-form';
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
    .from('controls')
    .select('*', { count: 'exact' })
    .order(params.sort === 'title' ? 'title' : 'sort_order');
  const q = searchTerm(params.q);
  if (q) query = query.or(`title.ilike.%${q}%,code.ilike.%${q}%,category.ilike.%${q}%`);
  if (params.review && ['PENDING', 'REVIEWED'].includes(params.review))
    query = query.eq('legal_review_status', params.review);
  if (params.active) query = query.eq('active', params.active === 'true');
  const { data, count, error } = await query.range(...pageRange(page));
  if (error) throw error;
  return (
    <>
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="page-title">Catálogo de controles</h1>
          <p className="muted mt-2">
            Criterios operativos de evaluación con referencias editables.
          </p>
        </div>
        {profile.role === 'SUPER_ADMIN' && (
          <Button asChild>
            <Link href="/administration/controls/new">Nuevo control</Link>
          </Button>
        )}
      </div>
      <p className="text-sm text-slate-600">
        Los controles iniciales son orientativos y están pendientes de revisión jurídica. Su
        aplicabilidad debe ser revisada por un profesional.
      </p>
      <form className="flex flex-wrap gap-3 items-end">
        <label className="form-label flex-1 min-w-40">
          Buscar
          <input
            className="field"
            name="q"
            defaultValue={params.q}
            placeholder="Código, título o categoría"
          />
        </label>
        <label className="form-label">
          Revisión
          <select name="review" className="field" defaultValue={params.review || ''}>
            <option value="">Todas</option>
            <option value="PENDING">Pendiente</option>
            <option value="REVIEWED">Revisada</option>
          </select>
        </label>
        {profile.role === 'SUPER_ADMIN' && (
          <label className="form-label">
            Activación
            <select className="field" name="active" defaultValue={params.active || ''}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>
        )}
        <label className="form-label">
          Orden
          <select className="field" name="sort" defaultValue={params.sort || 'code'}>
            <option value="code">Código</option>
            <option value="title">Título</option>
          </select>
        </label>
        <Button variant="outline">Filtrar</Button>
      </form>
      <div className="table-wrap scroll-grid accounts-grid">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Control</th>
              <th>Categoría</th>
              <th>Revisión jurídica</th>
              <th>Activo</th>
              <th>Modificar</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {(data as CatalogControl[]).map((control) => (
              <tr key={control.id}>
                <td className="font-mono">{control.code}</td>
                <td>
                  <Link
                    className="text-teal-800 font-semibold hover:underline"
                    href={`/administration/controls/${control.id}`}
                  >
                    {control.title}
                  </Link>
                </td>
                <td>{control.category}</td>
                <td>
                  <span className="badge">
                    {control.legal_review_status === 'PENDING' ? 'Pendiente' : 'Revisada'}
                  </span>
                </td>
                <td>{control.active ? 'Sí' : 'No'}</td>
                <td>
                  <Button
                    asChild
                    variant="edit"
                    size="icon"
                    title="Modificar control"
                    aria-label={`Modificar control: ${control.code}`}
                  >
                    <Link href={`/administration/controls/${control.id}`}>
                      <Pencil size={18} />
                    </Link>
                  </Button>
                </td>
                <td>
                  <DeleteControlButton id={control.id} code={control.code} title={control.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && (
          <p className="empty">
            No se encontraron controles. Aplique el seed inicial para cargar el catálogo.
          </p>
        )}
      </div>
      <Pagination page={page} count={count || 0} path="/administration/controls" params={params} />
    </>
  );
}
