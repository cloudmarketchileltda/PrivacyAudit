import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="max-w-xl mx-auto p-6 mt-12">
      <h1 className="page-title mb-4">Registro no disponible</h1>
      <p className="muted">El registro no existe o su cuenta no tiene acceso.</p>
      <Link className="underline block mt-5" href="/dashboard">
        Volver al dashboard
      </Link>
    </main>
  );
}
