import Link from 'next/link';
import { ActionForm, Field } from '@/components/forms';
import { signup } from '@/features/auth/actions';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { token } = await searchParams;
  return (
    <>
      <h1 className="page-title mb-2">{token ? 'Cuenta de cliente' : 'Crear cuenta'}</h1>
      <p className="muted mb-6">
        {token
          ? 'Use el email que recibió la invitación.'
          : 'Regístrese para gestionar sus organizaciones como consultor.'}
      </p>
      <ActionForm action={signup} label="Registrarme">
        <input type="hidden" name="token" value={token || ''} />
        <Field label="Nombre completo" name="full_name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Contraseña (mínimo 10 caracteres)" name="password" type="password" required />
      </ActionForm>
      <p className="mt-6 text-sm">
        <Link href="/login" className="underline">
          Ya tengo cuenta
        </Link>
      </p>
    </>
  );
}
