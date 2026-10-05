import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { isConfigured } from '@/lib/config';
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold mb-8">
          <ShieldCheck className="text-teal-800" />
          PrivacyAudit
        </Link>
        {!isConfigured() && (
          <p className="error-message mb-4">
            Configure Supabase antes de utilizar estos formularios.{' '}
            <Link className="underline" href="/setup">
              Ver configuración
            </Link>
          </p>
        )}
        <div className="panel">{children}</div>
        <p className="muted mt-5 text-center">Gestión y diagnóstico de protección de datos.</p>
      </div>
    </main>
  );
}
