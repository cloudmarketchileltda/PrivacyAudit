import { gridCssVariables } from '@/config/general';
import { SiteFooter } from '@/components/site-footer';
import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
const bodyFont = localFont({
  src: './fonts/inter.ttf',
  variable: '--font-body',
  display: 'swap',
  weight: '400 700',
});
const headingFont = localFont({
  src: './fonts/space-grotesk.ttf',
  variable: '--font-heading',
  display: 'swap',
  weight: '400 700',
});
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { default: 'PrivacyAudit', template: '%s · PrivacyAudit' },
  description: 'Gestión y evaluación de programas de protección de datos.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bodyFont.variable} ${headingFont.variable}`}>
      <body className="flex min-h-screen flex-col" style={gridCssVariables as CSSProperties}>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
