import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
export default async function Page() {
  const { profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  return (
    <>
      <h1 className="page-title">Administración</h1>
      <div className="grid md:grid-cols-2 gap-5">
        <Link href="/users" className="panel p-6 hover:border-teal-700">
          <h2 className="section-title">Administración de cuentas</h2>
          <p className="muted">Administrar roles y usuarios del sistema.</p>
        </Link>
        <Link href="/administration/memberships" className="panel p-6 hover:border-teal-700">
          <h2 className="section-title">Usuarios y membresías</h2>
          <p className="muted">Asignar una organización a clientes y varias a consultores.</p>
        </Link>
        <Link href="/administration/audit" className="panel p-6 hover:border-teal-700">
          <h2 className="section-title">Log auditable</h2>
          <p className="muted">
            Consultar acciones, exportar el registro y administrar su conservación.
          </p>
        </Link>
      </div>
    </>
  );
}
