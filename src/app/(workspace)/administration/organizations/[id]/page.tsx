import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import { ActionForm, Field } from '@/components/forms';
import { inviteClient, removeMember, revokeInvite } from '@/features/organizations/actions';
import { formatDate } from '@/lib/utils';
import type { Organization, Profile } from '@/types/domain';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db, user, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  const { data, error } = await db.from('organizations').select('*').eq('id', id).single();
  if (error || !data) notFound();
  const org = data as Organization;
  const { data: manager } = await db.rpc('can_manage_organization', { org: id });
  const [{ data: members, error: memberError }, { data: invites, error: inviteError }] =
    await Promise.all([
      db.from('organization_members').select('user_id,role').eq('organization_id', id),
      manager
        ? db
            .from('organization_invitations')
            .select('id,email,expires_at,accepted_at,revoked_at')
            .eq('organization_id', id)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);
  if (memberError || inviteError) throw memberError || inviteError;
  const { data: profiles } = members?.length
    ? await db
        .from('profiles')
        .select('id,full_name,role')
        .in(
          'id',
          members.map((m) => m.user_id),
        )
    : { data: [] };
  const labels: Record<string, string> = { YES: 'Sí', NO: 'No', UNKNOWN: 'No determinado' };
  return (
    <>
      <div className="flex flex-wrap justify-between gap-4 items-center">
        <div>
          <p className="muted mb-1">Organizaciones / Resumen</p>
          <h1 className="page-title break-words">{org.legal_name}</h1>
          <p className="muted mt-2">
            {org.rut} · {org.industry || 'Industria sin registrar'} ·{' '}
            {org.status === 'ACTIVE' ? 'Activa' : 'Archivada'}
          </p>
        </div>
        {manager && (
          <Button variant="outline" asChild>
            <Link href={`/administration/organizations/${id}/edit`}>Editar organización</Link>
          </Button>
        )}
      </div>
      <nav
        className="flex flex-wrap gap-5 border-b border-slate-200 pb-3 text-sm"
        aria-label="Organización"
      >
        <span className="font-semibold text-teal-800">Resumen</span>
        <Link href={`/assessments?organization=${id}`} className="hover:underline">
          Evaluaciones
        </Link>
        <Link href={`/organizations/${id}/processing`} className="hover:underline">
          Tratamientos
        </Link>
        <Link href={`/findings?organization=${id}`} className="hover:underline">
          Hallazgos
        </Link>
        <Link href={`/action-plan?organization=${id}`} className="hover:underline">
          Plan de acción
        </Link>
        <Link href={`/tasks?organization=${id}`} className="hover:underline">
          Tareas
        </Link>
        <Link href={`/evidence?organization=${id}`} className="hover:underline">
          Evidencias
        </Link>
      </nav>
      <section className="panel">
        <h2 className="section-title">Información de la empresa</h2>
        <dl className="form-grid">
          {[
            ['Nombre comercial', org.trade_name],
            ['Trabajadores', String(org.employee_count ?? '')],
            ['Contacto', org.contact_name],
            ['Email', org.contact_email],
            ['Teléfono', org.contact_phone],
            ['Responsable de privacidad', org.privacy_officer],
            ['Dirección', org.address],
            ['Sitio web', org.website],
            ['Creación', formatDate(org.created_at)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="muted">{label}</dt>
              <dd className="text-sm break-words mt-1">{value || 'Sin registrar'}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel">
        <h2 className="section-title">Perfil de tratamiento</h2>
        <dl className="form-grid">
          {[
            ['Datos de clientes', org.treats_clients],
            ['Datos de trabajadores', org.treats_employees],
            ['Datos de proveedores', org.treats_suppliers],
            ['Cámaras', org.uses_cameras],
            ['Marketing', org.marketing],
            ['Proveedores externos', org.external_providers],
            ['Página web', org.has_website],
            ['Formularios web', org.web_forms],
          ].map(([label, value]) => (
            <div key={String(label)} className="flex justify-between gap-3 text-sm">
              <dt>{label}</dt>
              <dd className="font-medium">{value ? 'Sí' : 'No'}</dd>
            </div>
          ))}
          <div className="text-sm">
            Datos sensibles: <strong>{labels[org.sensitive_data]}</strong>
          </div>
          <div className="text-sm">
            Transferencias internacionales: <strong>{labels[org.international_transfers]}</strong>
          </div>
        </dl>
      </section>
      {manager && (
        <>
          <section className="panel">
            <h2 className="section-title">Usuarios y membresías</h2>
            <div className="space-y-4">
              {members?.map((member) => (
                <div
                  key={member.user_id}
                  className="flex flex-wrap justify-between gap-4 border-b border-slate-100 pb-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {(profiles as Profile[])?.find((p) => p.id === member.user_id)?.full_name ||
                        member.user_id}
                    </p>
                    <p className="muted">
                      {member.role === 'CONSULTANT' ? 'Consultor' : 'Cliente'}
                      {member.user_id === user.id ? ' · Usted' : ''}
                    </p>
                  </div>
                  {member.user_id !== user.id && (
                    <ActionForm action={removeMember} label="Retirar acceso" variant="outline">
                      <input type="hidden" name="org" value={id} />
                      <input type="hidden" name="target" value={member.user_id} />
                    </ActionForm>
                  )}
                </div>
              ))}
            </div>
            {org.status === 'ACTIVE' && (
              <div className="max-w-md mt-6">
                <h3 className="text-sm font-semibold mb-3">Invitar usuario cliente</h3>
                <ActionForm action={inviteClient} label="Crear enlace" variant="default">
                  <input type="hidden" name="org" value={id} />
                  <Field label="Email del cliente" name="email" type="email" required />
                </ActionForm>
              </div>
            )}
            {profile.role === 'SUPER_ADMIN' && (
              <div className="mt-6 max-w-md">
                <Link href="/administration/memberships" className="text-teal-800 underline">
                  Gestionar asignaciones de clientes y consultores
                </Link>
              </div>
            )}
          </section>
          {Boolean(invites?.length) && (
            <section className="panel">
              <h2 className="section-title">Invitaciones</h2>
              <div className="space-y-4">
                {invites?.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap justify-between gap-4">
                    <div className="text-sm">
                      <p className="font-medium break-all">{inv.email}</p>
                      <p className="muted">
                        {inv.accepted_at
                          ? 'Aceptada'
                          : inv.revoked_at
                            ? 'Revocada'
                            : new Date(inv.expires_at) < new Date()
                              ? 'Vencida'
                              : `Vence ${formatDate(inv.expires_at)}`}
                      </p>
                    </div>
                    {!inv.accepted_at && !inv.revoked_at && (
                      <ActionForm action={revokeInvite} label="Revocar" variant="outline">
                        <input type="hidden" name="id" value={inv.id} />
                      </ActionForm>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
