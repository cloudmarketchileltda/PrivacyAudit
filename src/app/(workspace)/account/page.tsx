import { requireUser } from '@/features/auth/queries';
import { ActionForm, Field } from '@/components/forms';
import { saveAccountProfile, changeOwnPassword } from '@/features/account/actions';
import { ContactFields } from '@/features/account/contact-fields';
import { generalConfig } from '@/config/general';
import Link from 'next/link';
export default async function Page() {
  const { profile, user, db } = await requireUser();
  const { data: contact, error } = await db
    .from('account_details')
    .select('address,phone,city,country')
    .eq('user_id', user.id)
    .single();
  if (error || !contact) throw new Error('No se pudieron cargar sus datos de contacto.');
  return (
    <>
      <h1 className="page-title">Mi cuenta</h1>
      <section className="panel max-w-xl">
        <h2 className="section-title">Datos personales y de contacto</h2>
        <p className="muted mb-6">
          {user.email} · {profile.role}
        </p>
        <ActionForm action={saveAccountProfile} label="Guardar datos de cuenta">
          <Field
            label="Nombre completo"
            name="full_name"
            defaultValue={profile.full_name}
            required
            autoComplete="name"
            maxLength={generalConfig.account.fullNameMaxLength}
          />
          <ContactFields contact={contact} />
        </ActionForm>
      </section>
      <section className="panel max-w-xl">
        <h2 className="section-title">Correo electrónico</h2>
        <p className="muted mb-4">{user.email}</p>
        <p className="muted">{generalConfig.account.emailManagementNotice}</p>
      </section>
      <section className="panel max-w-xl">
        <h2 className="section-title">Cambiar contraseña</h2>
        <ActionForm action={changeOwnPassword} label="Guardar nueva contraseña">
          <Field
            label="Contraseña actual"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={generalConfig.account.passwordMaxLength}
          />
          <Field
            label="Nueva contraseña (10 a 128 caracteres)"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            maxLength={generalConfig.account.passwordMaxLength}
          />
          <Field
            label="Confirmar nueva contraseña"
            name="password_confirmation"
            type="password"
            required
            autoComplete="new-password"
            maxLength={generalConfig.account.passwordMaxLength}
          />
        </ActionForm>
        <Link className="block underline text-sm mt-6" href="/recover">
          ¿Olvidó su contraseña? Solicitar recuperación al administrador
        </Link>
      </section>
    </>
  );
}
