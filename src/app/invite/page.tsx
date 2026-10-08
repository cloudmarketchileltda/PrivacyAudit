import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/config';
import { redirect } from 'next/navigation';
import { ActionForm } from '@/components/forms';
import { acceptInvite } from '@/features/auth/actions';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!isConfigured()) redirect('/setup');
  const { token } = await searchParams;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  return (
    <main className="max-w-xl mx-auto p-5 mt-16">
      <section className="panel">
        <h1 className="page-title mb-4">Invitación a una organización</h1>
        <p className="muted mb-6">
          Use la cuenta con el email al que está dirigida la invitación. El acceso permite consultar
          evaluaciones de esa organización.
        </p>
        {user ? (
          <ActionForm action={acceptInvite} label="Aceptar invitación">
            <p className="text-sm">Sesión: {user.email}</p>
            <input type="hidden" name="token" value={token || ''} />
          </ActionForm>
        ) : (
          <div className="flex flex-wrap gap-4">
            <Link
              className="underline"
              href={`/login?next=${encodeURIComponent(`/invite?token=${token || ''}`)}`}
            >
              Iniciar sesión
            </Link>
            <p className="muted">
              Si todavía no tiene cuenta, solicite su creación al administrador.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
