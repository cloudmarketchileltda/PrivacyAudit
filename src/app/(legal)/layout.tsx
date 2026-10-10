import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { generalConfig } from '@/config/general';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1">
      <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-9">
        <Link
          href={generalConfig.site.homeHref}
          aria-label="PrivacyAudit — Ir al inicio"
          className="inline-flex items-center gap-2 rounded-md text-xl font-semibold"
        >
          <ShieldCheck aria-hidden="true" className="text-blue-700" />
          PrivacyAudit
        </Link>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8 md:py-12">
        {children}
        <Link
          href={generalConfig.site.homeHref}
          className="inline-block rounded-sm text-sm font-medium text-blue-700 underline"
        >
          Volver al inicio
        </Link>
      </main>
    </div>
  );
}
