'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { generalConfig } from '@/config/general';
const labels: Record<string, string> = {
  home: 'Inicio',
  dashboard: 'Dashboard',
  assessments: 'Evaluaciones',
  processing: 'Tratamientos',
  findings: 'Hallazgos',
  tasks: 'Tareas',
  evidence: 'Evidencias',
  reports: 'Informes',
  'action-plan': 'Plan de acción',
  administration: 'Administración',
  organizations: 'Organizaciones',
  controls: 'Controles',
  users: 'Usuarios',
  memberships: 'Membresías',
  audit: 'Auditoría',
  'legal-library': 'Centro normativo',
  account: 'Mi cuenta',
  notifications: 'Notificaciones',
  new: 'Nuevo registro',
  edit: 'Editar',
};
export function Breadcrumbs() {
  const parts = usePathname().split('/').filter(Boolean);
  if (parts.length < 2) return null;
  return (
    <nav aria-label="Ruta de navegación" className="mb-5 text-xs text-slate-500">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            href={generalConfig.site.workspaceHomeHref}
            className="hover:text-blue-700 hover:underline"
          >
            Inicio
          </Link>
        </li>
        {parts.map((part, i) => (
          <li key={i} className="flex items-center gap-2">
            <ChevronRight size={13} aria-hidden="true" />
            {i === parts.length - 1 ? (
              <span aria-current="page" className="font-medium text-slate-700">
                {labels[part] || 'Detalle'}
              </span>
            ) : i === 0 ? (
              <Link
                href={`/${parts.slice(0, i + 1).join('/')}`}
                className="hover:text-blue-700 hover:underline"
              >
                {labels[part] || 'Detalle'}
              </Link>
            ) : (
              <span>{labels[part] || 'Detalle'}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
