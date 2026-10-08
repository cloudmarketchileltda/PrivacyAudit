import { createAccount } from '@/features/users/actions';
import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { ActionForm, Field } from '@/components/forms';
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
      <section className="panel max-w-xl">
        <h2 className="section-title">Crear cuenta de usuario</h2>
        <p className="muted mb-4">
          Cree una cuenta de cliente o consultor. El rol no asigna acceso a una organización
          existente.
        </p>
        <ActionForm action={createAccount} label="Crear cuenta">
          <Field label="Nombre completo" name="full_name" required />
          <Field label="Correo electrónico" name="email" type="email" required />
          <Field
            label="Contraseña inicial (10 a 128 caracteres)"
            name="password"
            type="password"
            required
          />
          <label className="form-label">
            Rol
            <select className="field" name="role" defaultValue="CLIENT">
              <option value="CLIENT">Cliente</option>
              <option value="CONSULTANT">Consultor</option>
            </select>
          </label>
          <p className="muted">
            La cuenta quedará habilitada por el administrador sin correo de confirmación. Comparta
            las credenciales de forma segura. El usuario puede cambiar su contraseña mediante
            Recuperar acceso.
          </p>
        </ActionForm>
      </section>
      <h2 className="section-title">Usuarios existentes y roles</h2>
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
                    <option value="CLIENT">Cliente</option>
                    <option value="CONSULTANT">Consultor</option>
                    <option value="SUPER_ADMIN">Administrador del sistema</option>
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
