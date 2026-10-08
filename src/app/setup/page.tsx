import Link from 'next/link';
import { ShieldCheck, Database, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function Page() {
  return (
    <main className="flex-1 grid place-items-center p-5">
      <div className="max-w-2xl w-full">
        <div className="flex gap-2 items-center text-xl font-semibold mb-8">
          <ShieldCheck className="text-teal-800" />
          PrivacyAudit
        </div>
        <section className="panel">
          <span className="badge mb-5">Fases 1 y 2 · Configuración</span>
          <h1 className="page-title mb-4">Prepare su espacio de evaluación</h1>
          <p className="muted">
            La aplicación necesita una conexión Supabase para autenticar usuarios y guardar
            información. No hay una base de datos configurada en este entorno.
          </p>
          <ol className="my-7 space-y-5 text-sm">
            <li>
              <strong>1. Configure la conexión</strong>
              <p className="muted">
                Copie .env.example a .env.local y complete la URL y la clave pública de Supabase.
              </p>
            </li>
            <li>
              <strong>2. Aplique las migraciones</strong>
              <p className="muted">
                Ejecute las migraciones de fase 1 y fase 2, y el seed del catálogo siguiendo
                README.md.
              </p>
            </li>
            <li>
              <strong>3. Configure Auth y reinicie</strong>
              <p className="muted">
                Agregue las URLs de retorno, habilite email y contraseña y reinicie el servidor.
              </p>
            </li>
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Iniciar sesión
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
          <div className="mt-7 flex gap-2 items-center text-xs text-slate-500">
            <Database size={15} /> Los datos se mantienen aislados por organización mediante RLS.
          </div>
        </section>
        <p className="muted mt-5">
          PrivacyAudit apoya la gestión y el diagnóstico. Los resultados de evaluación requieren
          interpretación profesional.
        </p>
      </div>
    </main>
  );
}
