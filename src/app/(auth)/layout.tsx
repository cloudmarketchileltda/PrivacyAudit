import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { isConfigured } from '@/lib/config';
import { generalConfig } from '@/config/general';
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-surface flex flex-1 items-center justify-center px-5 py-10 md:py-16">
      <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-20">
        <div className="auth-intro">
          <a
            href={generalConfig.site.brand.href}
            aria-label="Ir a CloudMarket"
            className="mb-7 inline-flex rounded-xl bg-white px-4 py-2"
          >
            <BrandLogo />
          </a>
          <Link
            href={generalConfig.site.homeHref}
            className="brand-name mb-5 flex w-fit items-center gap-2 text-lg font-semibold"
          >
            <ShieldCheck className="text-blue-300" aria-hidden="true" />
            PrivacyAudit
          </Link>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-5xl">
            La privacidad de su organización, en un solo lugar.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Evaluaciones, hallazgos y tareas para acompañar su programa de protección de datos.
          </p>
          <a
            href={generalConfig.site.brand.href}
            className="mt-7 inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Volver a CloudMarket
          </a>
        </div>
        <div className="w-full min-w-0 lg:max-w-md">
          {!isConfigured() && (
            <p className="error-message mb-4">
              Configure Supabase antes de utilizar estos formularios.{' '}
              <Link className="underline" href="/setup">
                Ver configuración
              </Link>
            </p>
          )}
          <div className="panel shadow-2xl shadow-black/20">{children}</div>
          <p className="mt-5 text-center text-xs leading-5 text-slate-300">
            PrivacyAudit · {generalConfig.site.brand.name}
          </p>
        </div>
      </div>
    </main>
  );
}
