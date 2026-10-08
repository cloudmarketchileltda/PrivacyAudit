import { requireUser } from '@/features/auth/queries';
import { ActionForm, Field } from '@/components/forms';
import { saveAccountProfile, changeOwnPassword, changeOwnEmail } from '@/features/account/actions';
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
        <h2 className="section-title">Cambiar correo electrónico</h2>
        <p className="muted mb-4">
          Correo actual: {user.email}
          {user.new_email ? ` · Cambio pendiente: ${user.new_email}` : ''}
        </p>
        <ActionForm action={changeOwnEmail} label="Solicitar cambio de correo">
          <Field
            label="Nuevo correo electrónico"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={generalConfig.account.emailMaxLength}
          />
          <Field
            label="Contraseña actual para cambiar el correo"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={generalConfig.account.passwordMaxLength}
          />
          <p className="muted">
            El cambio puede requerir confirmación en el correo actual y el nuevo.
          </p>
        </ActionForm>
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
          ¿Olvidó su contraseña? Recuperar acceso por correo
        </Link>
      </section>
    </>
  );
}
