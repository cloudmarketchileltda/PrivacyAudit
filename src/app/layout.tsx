import { gridCssVariables } from '@/config/general';
import { SiteFooter } from '@/components/site-footer';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { default: 'PrivacyAudit', template: '%s · PrivacyAudit' },
  description: 'Gestión y evaluación de programas de protección de datos.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col" style={gridCssVariables as CSSProperties}>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
