import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
import { MembershipForm } from '@/features/users/membership-form';
import { Pagination, pageNumber, searchTerm } from '@/components/table-tools';
import { Button } from '@/components/ui/button';
const organizationSchema = z.object({
  id: z.uuid(),
  legal_name: z.string(),
  rut: z.string(),
  status: z.enum(['ACTIVE', 'ARCHIVED']),
});
const usersSchema = z.object({
  count: z.number().int().nonnegative(),
  users: z.array(
    z.object({
      id: z.uuid(),
      full_name: z.string(),
      email: z.string(),
      organizations: z.array(z.uuid()),
    }),
  ),
});
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  const params = await searchParams;
  const clientPage = pageNumber(params.client_page);
  const consultantPage = pageNumber(params.consultant_page);
  const responses = await Promise.all([
    db.rpc('admin_membership_organizations'),
    db.rpc('admin_membership_users', {
      member_role: 'CLIENT',
      term: searchTerm(params.client_q),
      page_number: clientPage,
    }),
    db.rpc('admin_membership_users', {
      member_role: 'CONSULTANT',
      term: searchTerm(params.consultant_q),
      page_number: consultantPage,
    }),
  ]);
  for (const response of responses)
    if (response.error) throw new Error('No se pudieron cargar los usuarios y membresías.');
  const organizations = z.array(organizationSchema).parse(responses[0].data);
  const clients = usersSchema.parse(responses[1].data);
  const consultants = usersSchema.parse(responses[2].data);
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div>
          <Link href="/administration" className="muted underline">
            Administración
          </Link>
          <h1 className="page-title mt-2">Usuarios y membresías</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/users">Crear usuarios y administrar roles</Link>
        </Button>
      </div>
      <form className="panel flex flex-wrap items-end gap-4">
        <label className="form-label flex-1 min-w-56">
          Buscar clientes
          <input
            name="client_q"
            defaultValue={params.client_q}
            placeholder="Nombre o correo"
            className="field"
          />
        </label>
        <label className="form-label flex-1 min-w-56">
          Buscar consultores
          <input
            name="consultant_q"
            defaultValue={params.consultant_q}
            placeholder="Nombre o correo"
            className="field"
          />
        </label>
        <Button variant="outline">Buscar</Button>
      </form>
      {[
        {
          title: 'Clientes',
          role: 'CLIENT' as const,
          grid: clients,
          page: clientPage,
          pageParam: 'client_page',
          description:
            'Cada cliente puede pertenecer a una sola organización. Al cambiarla, se retira su acceso anterior. Seleccione Sin organización para quitar la asignación.',
        },
        {
          title: 'Consultores',
          role: 'CONSULTANT' as const,
          grid: consultants,
          page: consultantPage,
          pageParam: 'consultant_page',
          description:
            'Cada consultor puede gestionar varias organizaciones. Marque las que tendrá asignadas; al desmarcar una, se retira su acceso a ella.',
        },
      ].map((section) => (
        <section key={section.role} aria-label={section.title} className="space-y-4">
          <div>
            <h2 className="section-title">{section.title}</h2>
            <p className="muted">{section.description}</p>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Organizaciones actuales</th>
                  <th>Asignación</th>
                </tr>
              </thead>
              <tbody>
                {section.grid.users.map((member) => (
                  <tr key={member.id}>
                    <td className="min-w-52">
                      <p className="font-semibold">{member.full_name || 'Sin nombre'}</p>
                      <p className="muted break-all">{member.email || 'Sin correo'}</p>
                    </td>
                    <td className="min-w-52">
                      {member.organizations.length ? (
                        <ul className="space-y-2">
                          {member.organizations.map((orgId) => {
                            const org = organizations.find((org) => org.id === orgId);
                            return (
                              <li key={orgId}>
                                {org ? (
                                  <Link
                                    href={`/administration/organizations/${org.id}`}
                                    className="text-teal-800 underline"
                                  >
                                    {org.legal_name}
                                    {org.status === 'ARCHIVED' ? ' · Archivada' : ''}
                                  </Link>
                                ) : (
                                  'Organización no disponible'
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <span className="muted">Sin organización asignada</span>
                      )}
                    </td>
                    <td>
                      <MembershipForm
                        target={member.id}
                        role={section.role}
                        current={member.organizations}
                        organizations={organizations}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {section.grid.users.length === 0 && (
              <p className="empty">No se encontraron {section.title.toLowerCase()}.</p>
            )}
          </div>
          <Pagination
            count={section.grid.count}
            page={section.page}
            path="/administration/memberships"
            params={params}
            pageParam={section.pageParam}
          />
        </section>
      ))}
      <p className="muted">
        Las organizaciones archivadas conservan sus membresías, pero no admiten nuevas asignaciones.
      </p>
    </>
  );
}
