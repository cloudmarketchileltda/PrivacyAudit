import Link from 'next/link';
import { createAccount } from '@/features/users/actions';
import { requireUser } from '@/features/auth/queries';
import { notFound } from 'next/navigation';
import { ActionForm, Field } from '@/components/forms';
import { AccountAction } from '@/features/users/account-action';
import { z } from '@/lib/validation';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';

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
  const { data: result, error } = await db.rpc('admin_accounts', {
    term: searchTerm(params.q),
    page_number: page,
  });
  if (error) throw new Error('No se pudieron cargar las cuentas.');
  const { users: accounts, count } = z
    .object({
      count: z.number(),
      users: z.array(
        z.object({
          id: z.uuid(),
          full_name: z.string(),
          email: z.string(),
          role: z.enum(['CLIENT', 'CONSULTANT', 'SUPER_ADMIN']),
        }),
      ),
    })
    .parse(result);
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <h1 className="page-title">Administración de cuentas</h1>
        <Button asChild variant="outline">
          <Link href="/administration/memberships">Usuarios y membresías</Link>
        </Button>
      </div>
      <section className="panel max-w-xl">
        <h2 className="section-title">Crear cuenta de usuario</h2>
        <p className="muted mb-4">
          Cree una cuenta de cliente o consultor. El rol no asigna acceso a una organización
          existente.
        </p>
        <ActionForm action={createAccount} label="Crear cuenta" variant="default">
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
      <h2 className="section-title">Cuentas de usuario</h2>
      <form className="flex gap-3 items-end">
        <label className="form-label flex-1">
          Buscar por nombre o correo
          <input className="field" name="q" defaultValue={params.q} />
        </label>
        <Button variant="outline">Buscar</Button>
      </form>
      <div
        className="table-wrap ten-row-grid"
        role="region"
        aria-label="Cuentas de usuario"
        // Scroll regions need a keyboard focus target.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <table className="data-table">
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo electrónico</th>
              <th>Modificar rol</th>
              <th>Modificar cuenta</th>
              <th>Eliminar</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>
                  <p className="grid-text font-semibold" title={account.full_name}>
                    {account.full_name || 'Sin nombre'}
                    {account.id === user.id ? ' · Usted' : ''}
                  </p>
                  <p className="muted">
                    {
                      { CLIENT: 'Cliente', CONSULTANT: 'Consultor', SUPER_ADMIN: 'Administrador' }[
                        account.role
                      ]
                    }
                  </p>
                </td>
                <td>
                  <p className="grid-text" title={account.email}>
                    {account.email}
                  </p>
                </td>
                {(['role', 'edit', 'delete'] as const).map((kind) => (
                  <td key={kind}>
                    <AccountAction
                      key={`${kind}:${account.full_name}:${account.email}:${account.role}`}
                      account={account}
                      kind={kind}
                      self={account.id === user.id}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!accounts.length && <p className="empty">No se encontraron cuentas.</p>}
      </div>
      <Pagination count={count || 0} page={page} path="/users" params={params} />
    </>
  );
}
