import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { ActionForm } from '@/components/forms';
import { setRole } from '@/features/organizations/actions';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import type { Profile } from '@/types/domain';
import { Button } from '@/components/ui/button';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { db, user, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  const params = await searchParams;
  const page = pageNumber(params.page);
  let query = db
    .from('profiles')
    .select('id,full_name,role', { count: 'exact' })
    .order('full_name');
  if (searchTerm(params.q)) query = query.ilike('full_name', `%${searchTerm(params.q)}%`);
  const { data, count, error } = await query.range((page - 1) * 20, page * 20 - 1);
  if (error) throw error;
  return (
    <>
      <h1 className="page-title">Usuarios</h1>
      <form className="flex gap-3 items-end">
        <label className="form-label flex-1">
          Buscar por nombre
          <input className="field" name="q" defaultValue={params.q} />
        </label>
        <Button variant="outline">Buscar</Button>
      </form>
      <section className="panel space-y-6">
        {(data as Profile[]).map((p) => (
          <div key={p.id} className="border-b border-slate-100 pb-4">
            <h2 className="font-semibold text-sm">
              {p.full_name || 'Sin nombre'}
              {p.id === user.id ? ' · Usted' : ''}
            </h2>
            <p className="muted break-all mb-3">{p.id}</p>
            {p.id !== user.id ? (
              <ActionForm action={setRole} label="Cambiar rol" variant="outline">
                <input type="hidden" name="target" value={p.id} />
                <label className="form-label">
                  Rol
                  <select className="field max-w-xs" name="new_role" defaultValue={p.role}>
                    <option>CLIENT</option>
                    <option>CONSULTANT</option>
                    <option>SUPER_ADMIN</option>
                  </select>
                </label>
              </ActionForm>
            ) : (
              <p className="muted">{p.role}</p>
            )}
          </div>
        ))}
      </section>
      <Pagination count={count || 0} page={page} path="/users" params={params} />
    </>
  );
}
