import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function Page() {
  return (
    <>
      <h1 className="page-title mb-6">Recuperar acceso</h1>
      <p className="mb-6">
        Si olvidó su contraseña, contacte al administrador de PrivacyAudit para que restablezca su
        acceso. Recibirá una nueva contraseña por el medio seguro que acuerden; no necesita un
        correo ni un enlace de recuperación.
      </p>
      <p className="muted mb-6">Después de iniciar sesión, cambie la contraseña desde Mi cuenta.</p>
      <Button asChild variant="outline">
        <Link href="/login">Volver a iniciar sesión</Link>
      </Button>
    </>
  );
}
