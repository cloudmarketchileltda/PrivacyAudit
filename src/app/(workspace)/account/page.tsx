import { requireUser } from '@/features/auth/queries';
import { ActionForm, Field } from '@/components/forms';
import { saveProfile } from '@/features/organizations/actions';
import Link from 'next/link';
export default async function Page() {
  const { profile, user } = await requireUser();
  return (
    <>
      <h1 className="page-title">Mi cuenta</h1>
      <section className="panel max-w-xl">
        <p className="muted mb-6">
          {user.email} · {profile.role}
        </p>
        <ActionForm action={saveProfile}>
          <Field
            label="Nombre completo"
            name="full_name"
            defaultValue={profile.full_name}
            required
          />
        </ActionForm>
        <Link className="block underline text-sm mt-6" href="/recover">
          Solicitar cambio de contraseña por email
        </Link>
      </section>
    </>
  );
}
