import Link from 'next/link';
import { requireUser } from '@/features/auth/queries';
import { ActionForm, Field } from '@/components/forms';
import { resetPassword } from '@/features/auth/actions';
export default async function Page() {
  await requireUser();
  return (
    <>
      <h1 className="page-title mb-6">Nueva contraseña</h1>
      <ActionForm action={resetPassword}>
        <Field label="Contraseña (mínimo 10 caracteres)" name="password" type="password" required />
      </ActionForm>
      <Link href="/dashboard" className="block underline text-sm mt-5">
        Volver al dashboard
      </Link>
    </>
  );
}
