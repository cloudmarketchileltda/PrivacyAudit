import Link from 'next/link';
import { ActionForm, Field } from '@/components/forms';
import { login } from '@/features/auth/actions';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  return (
    <>
      <h1 className="page-title mb-2">Iniciar sesión</h1>
      <p className="muted mb-6">
        Acceda a su espacio de auditoría. Si necesita una cuenta, solicítela al administrador.
      </p>
      {params.error && (
        <p role="alert" className="error-message mb-4">
          El enlace no es válido o ha vencido.
        </p>
      )}
      <ActionForm action={login} label="Entrar">
        <input type="hidden" name="next" value={params.next || '/dashboard'} />
        <Field label="Email" name="email" type="email" required />
        <Field label="Contraseña" name="password" type="password" required />
      </ActionForm>
      <div className="mt-6 flex justify-between gap-3 text-sm">
        <Link href="/recover" className="underline">
          Recuperar acceso
        </Link>
      </div>
    </>
  );
}
