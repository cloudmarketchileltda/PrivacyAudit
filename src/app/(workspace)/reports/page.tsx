import Link from 'next/link';
import { Download, Eye } from 'lucide-react';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import { Pagination, pageNumber } from '@/components/table-tools';
import { pageRange } from '@/config/general';
import { reportDate } from '@/features/reports/model';
import { z } from '@/lib/validation';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const filters = await searchParams;
  const page = pageNumber(filters.page);
  const organization = z.uuid().safeParse(filters.organization).success
    ? filters.organization
    : undefined;
  const { db } = await requireUser();
  let query = db
    .from('reports')
    .select('id,title,created_at,organization_id', { count: 'exact' })
    .order('created_at', { ascending: filters.sort === 'oldest' })
    .order('id')
    .range(...pageRange(page));
  if (organization) query = query.eq('organization_id', organization);
  const { data: reports, count, error } = await query;
  if (error)
    throw new Error('No se pudieron cargar los informes. Reintente o contacte al administrador.');
  return (
    <>
      <div>
        <h1 className="page-title">Informes</h1>
        <p className="muted mt-2">
          Versiones publicadas con datos a la fecha de corte. Para crear un informe, abra una
          evaluación y seleccione Publicar informe PDF.
        </p>
        {organization && (
          <Link
            className="text-teal-800 underline"
            href={`/assessments?organization=${organization}`}
          >
            Ver evaluaciones de esta organización
          </Link>
        )}
      </div>
      <form className="flex gap-3 items-end">
        {organization && <input type="hidden" name="organization" value={organization} />}
        <label className="form-label">
          Orden
          <select name="sort" className="field" defaultValue={filters.sort || 'newest'}>
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
          </select>
        </label>
        <Button variant="outline">Aplicar</Button>
      </form>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Informe</th>
              <th>Publicado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reports?.map((r) => (
              <tr key={r.id}>
                <td>
                  <Link
                    className="font-semibold text-teal-800 hover:underline"
                    href={`/reports/${r.id}`}
                  >
                    {r.title}
                  </Link>
                </td>
                <td>{reportDate(r.created_at)}</td>
                <td>
                  <div className="flex gap-2">
                    <Button asChild size="icon">
                      <Link
                        href={`/reports/${r.id}`}
                        aria-label={`Ver ${r.title}`}
                        title="Ver informe"
                      >
                        <Eye size={16} />
                      </Link>
                    </Button>
                    <Button asChild size="icon">
                      <a
                        href={`/api/reports/${r.id}/download`}
                        aria-label={`Descargar ${r.title}`}
                        title="Descargar PDF"
                      >
                        <Download size={16} />
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!reports?.length && <p className="empty">No hay informes publicados.</p>}
      </div>
      <Pagination page={page} count={count || 0} path="/reports" params={filters} />
    </>
  );
}
