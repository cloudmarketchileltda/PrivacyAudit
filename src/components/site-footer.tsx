import Link from 'next/link';
import { ExternalLink, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { generalConfig } from '@/config/general';

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
};

export function SiteFooter() {
  const { site } = generalConfig;
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-6 md:px-9">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="brand-name text-sm font-semibold text-slate-800">PrivacyAudit</p>
          <a href={site.brand.href} className="text-xs text-slate-500 hover:text-blue-700">
            Una plataforma de {site.brand.name}
          </a>
        </div>
        <nav
          aria-label="Información legal"
          className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600"
        >
          {site.legalLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="rounded-sm hover:text-blue-700 hover:underline">
              {label}
            </Link>
          ))}
          <a
            href={site.privacyLaw.href}
            target="_blank"
            rel="noopener noreferrer"
            title="Ley 21.719 — abre en una nueva pestaña"
            className="inline-flex items-center gap-1 rounded-sm hover:text-blue-700 hover:underline"
          >
            {site.privacyLaw.label}
            <ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only"> (abre en una nueva pestaña)</span>
          </a>
        </nav>
        <nav aria-label="Redes sociales" className="flex gap-2">
          {site.socialLinks.map(({ id, label, href }) => {
            const Icon = socialIcons[id];
            return (
              <a
                key={id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (abre en una nueva pestaña)`}
                title={`${label} — abre en una nueva pestaña`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <Icon size={18} aria-hidden="true" />
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
