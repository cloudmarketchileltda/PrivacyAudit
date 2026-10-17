'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  ListChecks,
  ClipboardList,
  FolderOpen,
  Users,
  UserRound,
  BookOpen,
  FileChartColumn,
  Fingerprint,
  SearchCheck,
} from 'lucide-react';
import { generalConfig } from '@/config/general';
import { cn } from '@/lib/utils';

export function Navigation({ admin, onNavigate }: { admin: boolean; onNavigate?: () => void }) {
  const path = usePathname();
  const groups = [
    {
      label: 'Espacio de trabajo',
      items: [
        [generalConfig.site.workspaceHomeHref, 'Inicio', Home],
        ['/dashboard', 'Dashboard', LayoutDashboard],
      ],
    },
    {
      label: 'Gestión',
      items: [
        ['/assessments', 'Evaluaciones', SearchCheck],
        ['/processing', 'Tratamientos', Fingerprint],
        ['/findings', 'Hallazgos', ListChecks],
        ['/tasks', 'Tareas', ClipboardList],
        ['/evidence', 'Evidencias', FolderOpen],
        ['/reports', 'Informes', FileChartColumn],
        ['/action-plan', 'Plan de acción', ListChecks],
      ],
    },
    {
      label: 'Recursos y cuenta',
      items: [
        [generalConfig.legalLibrary.href, generalConfig.legalLibrary.title, BookOpen],
        ...(admin ? [['/administration', 'Administración', Users] as const] : []),
        ['/account', 'Mi cuenta', UserRound],
      ],
    },
  ] as const;
  return (
    <nav aria-label="Navegación principal" className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={path === href || path.startsWith(`${href}/`) ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white',
                  (path === href || path.startsWith(`${href}/`)) &&
                    'bg-blue-600 text-white shadow-md shadow-blue-950/20',
                )}
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
